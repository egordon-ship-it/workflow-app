import type { WorkflowDefinition } from "./types";

/**
 * Billing program — business-process workflows.
 *
 * Emails matched from the production catalog + §3 timed sequences,
 * with logical companions attached (PayInvoice, InvoiceReq, PayInvText,
 * UpdateCC, InvoiceRet, CCREFUNDERR). Each step graph is built for visual rendering.
 *
 * Conflict priority: decline > invoice > expiry.
 * Day counts: TBD (RecurringReminderMailer / ReminderMailer) — shown as Wait nodes.
 */

export const BILLING_WORKFLOWS: WorkflowDefinition[] = [
  // ─── 1. Card decline recovery ─────────────────────────────────────
  {
    id: "billing-card-decline-recovery",
    sequenceKey: "Billing.CCDecline",
    name: "Card Decline Recovery",
    businessProcess: "Card decline recovery",
    departmentSlug: "billing",
    processType: "timed",
    summary:
      "Three-step dunning ladder after a declined recurring card charge. Branches to recovery (payment confirmation) or escalates to final notice and deactivation.",
    sourceJobs: ["RecurringReminderMailer"],
    enrollment: {
      summary:
        "Active recurring subscriber whose card charge is declined.",
      details: [
        "Entry: recurring credit/debit authorization fails.",
        "One enrollment per billing group at a time.",
      ],
    },
    start: {
      summary: "Recurring charge declined.",
      triggers: [
        "Event: card on file fails recurring authorization",
        "Job: RecurringReminderMailer runs Rem1→Rem2→Rem3",
      ],
    },
    stop: {
      summary: "Payment recovers, or final notice + deactivation path ends the ladder.",
      details: [
        "STOP on successful payment method update / charge → Payment Confirmation (RecCCApp).",
        "STOP after CCDenRem3 (hand off to deactivation).",
        "STOP if account cancelled.",
      ],
    },
    suppression: {
      summary: "Highest billing priority — suppresses invoice + expiry ladders.",
      priority: 1,
      details: [
        "Rank 1 of 3 (decline > invoice > expiry).",
        "Block Billing.InvoiceReminder and Billing.CCExpiry while active.",
      ],
    },
    entryStepId: "start",
    steps: [
      {
        id: "start",
        kind: "start",
        label: "Card charge declined",
        triggerKind: "event",
        triggerDetail: "Recurring card auth fails",
        note: "PaymentStatusSync / RecurringServicePayAuth → RecurringReminderMailer",
        next: "rem1",
      },
      {
        id: "rem1",
        kind: "email",
        label: "Decline reminder 1",
        emailKey: "CCDenRem1",
        subject: "Action Needed: Update Your Payment Method",
        next: "check1",
      },
      {
        id: "check1",
        kind: "branch",
        label: "Recovered?",
        branches: [
          {
            id: "yes1",
            label: "Yes — recovered",
            condition: "Payment method updated or charge succeeds",
            next: "exit-recovered",
            tone: "success",
          },
          {
            id: "no1",
            label: "No — continue",
            condition: "Still declined / unpaid",
            next: "wait1",
            tone: "danger",
          },
        ],
      },
      {
        id: "wait1",
        kind: "delay",
        label: "Wait (days TBD)",
        note: "Rem1 → Rem2 gap — RecurringReminderMailer",
        next: "rem2",
      },
      {
        id: "rem2",
        kind: "email",
        label: "Decline reminder 2",
        emailKey: "CCDenRem2",
        subject: "Second Reminder: Your Payment Method Will Expire Soon",
        note: "Warns $15 reactivation fee",
        next: "check2",
      },
      {
        id: "check2",
        kind: "branch",
        label: "Recovered?",
        branches: [
          {
            id: "yes2",
            label: "Yes — recovered",
            condition: "Payment method updated or charge succeeds",
            next: "exit-recovered",
            tone: "success",
          },
          {
            id: "no2",
            label: "No — continue",
            condition: "Still declined / unpaid",
            next: "wait2",
            tone: "danger",
          },
        ],
      },
      {
        id: "wait2",
        kind: "delay",
        label: "Wait (days TBD)",
        note: "Rem2 → Rem3 gap — RecurringReminderMailer",
        next: "rem3",
      },
      {
        id: "rem3",
        kind: "email",
        label: "Final notice",
        emailKey: "CCDenRem3",
        subject: "Final Notice: Service Scheduled for Deactivation Today",
        note: "References @DeactDate@",
        next: "exit-deactivate",
      },
      {
        id: "exit-recovered",
        kind: "exit",
        label: "Recovered → RecCCApp",
        note: "Triggers Billing.RecurringPaySuccess (RecCCApp)",
        exitTone: "success",
      },
      {
        id: "exit-deactivate",
        kind: "exit",
        label: "Deactivate service",
        note: "Ops handoff after final notice",
        exitTone: "danger",
      },
    ],
    emails: [
      {
        key: "CCDenRem1",
        name: "Credit Card Declined - Dynamic Media Music Service",
        subject: "Action Needed: Update Your Payment Method",
        purpose: "Credit Card Denied Reminder 1",
        trigger: "scheduled",
        apps: ["RecurringReminderMailer"],
        step: 1,
      },
      {
        key: "CCDenRem2",
        name: "Credit Card Declined [2nd Notice]",
        subject: "Second Reminder: Your Payment Method Will Expire Soon",
        purpose: "Credit Card Denied Reminder 2",
        trigger: "scheduled",
        apps: ["RecurringReminderMailer"],
        step: 2,
      },
      {
        key: "CCDenRem3",
        name: "Credit Card Declined [Final Notice]",
        subject: "Final Notice: Service Scheduled for Deactivation Today",
        purpose: "Credit Card Denied Reminder 3",
        trigger: "scheduled",
        apps: ["RecurringReminderMailer"],
        step: 3,
      },
    ],
    openQuestions: [
      "Exact day gaps Rem1→Rem2→Rem3",
      "Does mid-ladder recovery auto-fire RecCCApp?",
    ],
  },

  // ─── 2. Card expiration ───────────────────────────────────────────
  {
    id: "billing-card-expiration",
    sequenceKey: "Billing.CCExpiry",
    name: "Card Expiration",
    businessProcess: "Card expiration",
    departmentSlug: "billing",
    processType: "timed",
    summary:
      "Proactive ladder as a card nears expiry: CCExpire1 → CCExpire2, with optional agent UpdateCC. Stops when the card is updated.",
    sourceJobs: ["RecurringReminderMailer", "ReminderMailer"],
    enrollment: {
      summary: "Subscriber whose card enters the expiry lead window.",
      details: [
        "Entry: job detects @BillingGroup.Month@ / @BillingGroup.Year@ approaching.",
        "Skip if Card Decline Recovery is active.",
      ],
    },
    start: {
      summary: "Card expiry enters lead window.",
      triggers: [
        "Scheduled: RecurringReminderMailer / ReminderMailer expiry scan",
        "Optional manual: agent sends UpdateCC",
      ],
    },
    stop: {
      summary: "Card updated, or a higher-priority billing flow takes over.",
      details: [
        "STOP when payment method updated in portal.",
        "STOP if enrolled into Card Decline Recovery.",
        "STOP if account leaves card billing.",
      ],
    },
    suppression: {
      summary: "Lowest billing priority — yields to decline and invoice.",
      priority: 3,
      details: ["Rank 3 of 3 (decline > invoice > expiry)."],
    },
    entryStepId: "start",
    steps: [
      {
        id: "start",
        kind: "start",
        label: "Card enters expiry window",
        triggerKind: "scheduled",
        triggerDetail: "Expiry lead-time job",
        note: "RecurringReminderMailer / ReminderMailer scan",
        next: "wait-lead",
      },
      {
        id: "wait-lead",
        kind: "delay",
        label: "Lead time (days TBD)",
        note: "Days before card expiry month — confirm with Billing",
        next: "expire1",
      },
      {
        id: "expire1",
        kind: "email",
        label: "Expiry reminder 1",
        emailKey: "CCExpire1",
        subject: "Your Payment Method Is Expiring Soon",
        next: "check1",
      },
      {
        id: "check1",
        kind: "branch",
        label: "Card updated?",
        branches: [
          {
            id: "yes1",
            label: "Yes — updated",
            condition: "Payment method updated",
            next: "exit-updated",
            tone: "success",
          },
          {
            id: "no1",
            label: "No — continue",
            condition: "Card still near expiry",
            next: "wait1",
            tone: "danger",
          },
        ],
      },
      {
        id: "wait1",
        kind: "delay",
        label: "Wait (days TBD)",
        note: "CCExpire1 → CCExpire2 gap",
        next: "expire2",
      },
      {
        id: "expire2",
        kind: "email",
        label: "Expiry reminder 2",
        emailKey: "CCExpire2",
        subject:
          "Upcoming Credit Card Expiration [2nd Reminder] - Dynamic Media Music Service",
        next: "check2",
      },
      {
        id: "check2",
        kind: "branch",
        label: "Still needs update?",
        branches: [
          {
            id: "yes2",
            label: "Updated",
            condition: "Payment method updated",
            next: "exit-updated",
            tone: "success",
          },
          {
            id: "agent",
            label: "Agent assist",
            condition: "Agent sends UpdateCC from CRM",
            next: "updatecc",
            tone: "neutral",
          },
          {
            id: "done",
            label: "Ladder ends",
            condition: "No further auto step — monitor next cycle",
            next: "exit-monitor",
            tone: "neutral",
          },
        ],
      },
      {
        id: "updatecc",
        kind: "email",
        label: "Update card notice (manual)",
        emailKey: "UpdateCC",
        subject: "Action Needed: Update Your Payment Method",
        note: "Catalog: companion to CCExpire1/2 — agent/CRM send",
        next: "exit-updated",
      },
      {
        id: "exit-updated",
        kind: "exit",
        label: "Card updated — exit",
        exitTone: "success",
      },
      {
        id: "exit-monitor",
        kind: "exit",
        label: "Monitor next billing cycle",
        exitTone: "neutral",
      },
    ],
    emails: [
      {
        key: "CCExpire1",
        name: "Upcoming Credit Card Expiration",
        subject: "Your Payment Method Is Expiring Soon",
        purpose: "Expiring Credit Card Remind 1",
        trigger: "scheduled",
        apps: ["RecurringReminderMailer"],
        step: 1,
      },
      {
        key: "CCExpire2",
        name: "Upcoming Credit Card Expiration [2nd Reminder]",
        subject:
          "Upcoming Credit Card Expiration [2nd Reminder] - Dynamic Media Music Service",
        purpose: "Expiring Credit Card Remind 2",
        trigger: "scheduled",
        apps: ["RecurringReminderMailer", "ReminderMailer"],
        step: 2,
      },
      {
        key: "UpdateCC",
        name: "Update credit card notice",
        subject: "Action Needed: Update Your Payment Method",
        purpose: "Agent/CRM-initiated companion to CCExpire ladder",
        trigger: "manual",
        apps: ["CRM"],
        step: 3,
      },
    ],
    openQuestions: [
      "Lead days before expiry for CCExpire1",
      "Is UpdateCC required step 3 or optional only?",
    ],
  },

  // ─── 3. Invoice collection ────────────────────────────────────────
  {
    id: "billing-invoice-collection",
    sequenceKey: "Billing.InvoiceReminder",
    name: "Invoice Collection",
    businessProcess: "Invoice collection",
    departmentSlug: "billing",
    processType: "timed",
    summary:
      "Catalog joins PayInvoice (event) and InvoiceReq (manual) as entry, optional PayInvText SMS, then InvRem1→InvRem2 while unpaid.",
    sourceJobs: [
      "RecurringReminderMailer",
      "ReminderMailer",
      "CRM",
      "CustomerPortal",
    ],
    enrollment: {
      summary: "Customer with an open unpaid invoice.",
      details: [
        "Event entry: PayInvoice when invoice / pay link is ready (30-day link).",
        "Manual entry: InvoiceReq from billing context.",
        "Ladder: InvRem1→InvRem2 while unpaid (catalog timing notes).",
        "Skip ladder if Card Decline Recovery is active.",
      ],
    },
    start: {
      summary: "Invoice issued — event or agent send.",
      triggers: [
        "Event: PayInvoice",
        "Manual: InvoiceReq",
        "Optional SMS: PayInvText",
        "Scheduled: ReminderMailer InvRem1/2",
      ],
    },
    stop: {
      summary: "Invoice paid, voided, or decline priority wins.",
      details: [
        "STOP when paid (portal / check / recurring success).",
        "STOP if voided or refunded (InvoiceRet is a separate refund notice).",
        "STOP if Card Decline Recovery enrolls.",
      ],
    },
    suppression: {
      summary: "Mid priority — below decline, above expiry.",
      priority: 2,
      details: [
        "Rank 2 of 3.",
        "Do not double-send PayInvoice + InvoiceReq same day for same invoice.",
      ],
    },
    entryStepId: "start",
    steps: [
      {
        id: "start",
        kind: "start",
        label: "Invoice ready to collect",
        triggerKind: "event",
        triggerDetail: "PayInvoice event or InvoiceReq",
        note: "Event (CRM/CustomerPortal) or Manual agent send",
        next: "issue-path",
      },
      {
        id: "issue-path",
        kind: "branch",
        label: "How issued?",
        branches: [
          {
            id: "event",
            label: "System event",
            condition: "PayInvoice fires",
            next: "pay-invoice",
            tone: "neutral",
          },
          {
            id: "manual",
            label: "Agent send",
            condition: "Agent sends InvoiceReq",
            next: "invoice-req",
            tone: "neutral",
          },
        ],
      },
      {
        id: "pay-invoice",
        kind: "email",
        label: "Pay invoice notification",
        emailKey: "PayInvoice",
        subject: "Your Music Invoice Is Ready",
        note: "Pay link valid 30 days",
        next: "sms-gate",
      },
      {
        id: "invoice-req",
        kind: "email",
        label: "Send invoice (manual)",
        emailKey: "InvoiceReq",
        subject: "Your Music Invoice Is Ready",
        note: "Manual companion that seeds the unpaid ladder",
        next: "sms-gate",
      },
      {
        id: "sms-gate",
        kind: "branch",
        label: "Send SMS prompt?",
        branches: [
          {
            id: "sms-yes",
            label: "Yes — SMS",
            condition: "Agent triggers PayInvText",
            next: "pay-sms",
            tone: "neutral",
          },
          {
            id: "sms-no",
            label: "No — email only",
            condition: "Skip SMS",
            next: "paid-check-0",
            tone: "neutral",
          },
        ],
      },
      {
        id: "pay-sms",
        kind: "sms",
        label: "Pay invoice SMS",
        emailKey: "PayInvText",
        subject: "N/A — SMS message",
        next: "paid-check-0",
      },
      {
        id: "paid-check-0",
        kind: "branch",
        label: "Paid before reminders?",
        branches: [
          {
            id: "paid0",
            label: "Paid",
            condition: "Invoice paid",
            next: "exit-paid",
            tone: "success",
          },
          {
            id: "unpaid0",
            label: "Still unpaid",
            condition: "Unpaid / unviewed",
            next: "wait-rem1",
            tone: "danger",
          },
        ],
      },
      {
        id: "wait-rem1",
        kind: "delay",
        label: "Wait (days TBD)",
        note: "Issue → InvRem1 — ReminderMailer",
        next: "inv-rem1",
      },
      {
        id: "inv-rem1",
        kind: "email",
        label: "Invoice reminder 1",
        emailKey: "InvRem1",
        subject: "Reminder: Your Invoice Is Ready for Payment",
        next: "paid-check-1",
      },
      {
        id: "paid-check-1",
        kind: "branch",
        label: "Paid after Rem1?",
        branches: [
          {
            id: "paid1",
            label: "Paid",
            condition: "Invoice paid",
            next: "exit-paid",
            tone: "success",
          },
          {
            id: "unpaid1",
            label: "Still unpaid",
            condition: "Still unpaid",
            next: "wait-rem2",
            tone: "danger",
          },
        ],
      },
      {
        id: "wait-rem2",
        kind: "delay",
        label: "Wait (days TBD)",
        note: "InvRem1 → InvRem2 — ReminderMailer",
        next: "inv-rem2",
      },
      {
        id: "inv-rem2",
        kind: "email",
        label: "Invoice reminder 2",
        emailKey: "InvRem2",
        subject: "Second Reminder: Invoice Payment",
        next: "exit-escalate",
      },
      {
        id: "exit-paid",
        kind: "exit",
        label: "Paid — exit",
        note: "May fire RecCCApp if recurring",
        exitTone: "success",
      },
      {
        id: "exit-escalate",
        kind: "exit",
        label: "Escalate offline",
        note: "No further auto step in catalog",
        exitTone: "danger",
      },
    ],
    emails: [
      {
        key: "PayInvoice",
        name: "Pay invoice notification",
        subject: "Your Music Invoice Is Ready",
        purpose: "Event entry — invoice ready to pay",
        trigger: "event",
        apps: ["CRM", "CustomerPortal"],
        step: 1,
      },
      {
        key: "InvoiceReq",
        name: "Send invoice",
        subject: "Your Music Invoice Is Ready",
        purpose: "Manual entry — agent send from billing context",
        trigger: "manual",
        apps: ["CRM"],
        step: 1,
      },
      {
        key: "PayInvText",
        name: "Pay invoice text (SMS)",
        subject: "N/A - SMS message",
        purpose: "Optional SMS pay prompt",
        trigger: "manual",
        apps: ["CRM"],
      },
      {
        key: "InvRem1",
        name: "Your Invoice is Available for Payment",
        subject: "Reminder: Your Invoice Is Ready for Payment",
        purpose: "Invoice Reminder 1",
        trigger: "scheduled",
        apps: ["RecurringReminderMailer", "ReminderMailer"],
        step: 2,
      },
      {
        key: "InvRem2",
        name: "Your Invoice is Available for Payment (2nd)",
        subject: "Second Reminder: Invoice Payment",
        purpose: "Invoice Reminder 2",
        trigger: "scheduled",
        apps: ["RecurringReminderMailer"],
        step: 3,
      },
    ],
    openQuestions: [
      "Days from issue to InvRem1",
      "Gap InvRem1 → InvRem2",
    ],
  },

  // ─── 4. ACH rejection ─────────────────────────────────────────────
  {
    id: "billing-ach-rejection",
    sequenceKey: "Billing.ACHReject",
    name: "ACH Rejection",
    businessProcess: "ACH rejection",
    departmentSlug: "billing",
    processType: "trigger",
    summary:
      "Immediate RecACHRej when ACH rejects. No Rem2/Rem3 in the production catalog — unresolved cases escalate offline; success later fires Payment Confirmation.",
    sourceJobs: [
      "SMS.DM_CRM.RecurringServicePayAuth",
      "PaymentStatusSync",
    ],
    enrollment: {
      summary: "Subscriber whose ACH debit is rejected.",
      details: ["One notice per rejection event."],
    },
    start: {
      summary: "ACH reject event.",
      triggers: ["Event: ACH transaction rejected (RecACHRej)"],
    },
    stop: {
      summary: "After reject notice, or if bank info already updated.",
      details: [
        "STOP after RecACHRej sends.",
        "Later success → Payment Confirmation.",
      ],
    },
    suppression: {
      summary: "Payment-failure notice — coordinate with card decline.",
      priority: 1,
      details: [
        "Lock primary sender between RecurringServicePayAuth and PaymentStatusSync.",
      ],
    },
    entryStepId: "start",
    steps: [
      {
        id: "start",
        kind: "start",
        label: "ACH debit rejected",
        triggerKind: "event",
        triggerDetail: "ACH transaction rejected",
        note: "RecurringServicePayAuth / PaymentStatusSync",
        next: "already-fixed",
      },
      {
        id: "already-fixed",
        kind: "branch",
        label: "Bank already updated?",
        branches: [
          {
            id: "skip",
            label: "Yes — skip send",
            condition: "Bank account updated before mailer",
            next: "exit-skip",
            tone: "success",
          },
          {
            id: "send",
            label: "No — send notice",
            condition: "Still needs bank update",
            next: "reject-notice",
            tone: "danger",
          },
        ],
      },
      {
        id: "reject-notice",
        kind: "email",
        label: "ACH reject notice",
        emailKey: "RecACHRej",
        subject: "Action Needed: Update Your Bank Account Information",
        next: "after-send",
      },
      {
        id: "after-send",
        kind: "branch",
        label: "Resolved on next attempt?",
        branches: [
          {
            id: "ok",
            label: "Payment succeeds",
            condition: "Subsequent ACH / payment succeeds",
            next: "exit-recovered",
            tone: "success",
          },
          {
            id: "fail",
            label: "Still failing",
            condition: "Unresolved — escalate offline",
            next: "exit-escalate",
            tone: "danger",
          },
        ],
      },
      {
        id: "exit-skip",
        kind: "exit",
        label: "Skipped — already fixed",
        exitTone: "success",
      },
      {
        id: "exit-recovered",
        kind: "exit",
        label: "Recovered → Payment Confirmation",
        note: "RecCCApp",
        exitTone: "success",
      },
      {
        id: "exit-escalate",
        kind: "exit",
        label: "Escalate offline",
        note: "No Rem2/Rem3 in catalog today",
        exitTone: "danger",
      },
    ],
    emails: [
      {
        key: "RecACHRej",
        name: "ACH transaction rejected",
        subject: "Action Needed: Update Your Bank Account Information",
        purpose: "Immediate ACH reject notice",
        trigger: "event",
        apps: [
          "SMS.DM_CRM.RecurringServicePayAuth",
          "PaymentStatusSync",
        ],
        step: 1,
      },
    ],
    openQuestions: [
      "Should ACH grow a multi-step ladder like CC decline?",
      "Primary production sender app?",
    ],
  },

  // ─── 5. Payment confirmation ──────────────────────────────────────
  {
    id: "billing-payment-confirmation",
    sequenceKey: "Billing.RecurringPaySuccess",
    name: "Payment Confirmation",
    businessProcess: "Payment confirmation",
    departmentSlug: "billing",
    processType: "trigger",
    summary:
      "Immediate RecCCApp receipt on successful recurring payment, plus internal AEPayNotify when payment is applied. Clears active decline / ACH / invoice recovery enrollments for the paid period.",
    sourceJobs: [
      "PaymentStatusSync",
      "SMS.DM_CRM.RecurringServicePayAuth",
      "CleanUp",
      "CRM",
      "CustomerPortal",
      "DM_Store",
      "OnlineSign",
    ],
    enrollment: {
      summary: "Customer whose recurring payment posts successfully.",
      details: [
        "Customer receipt (RecCCApp) and staff notify (AEPayNotify) may fire for the same payment event.",
      ],
    },
    start: {
      summary: "Recurring payment succeeds / payment applied.",
      triggers: [
        "Event: Recurring Payment Confirmation (RecCCApp)",
        "Event: Payment applied (AEPayNotify)",
      ],
    },
    stop: {
      summary: "After customer receipt and/or staff notify send.",
      details: [
        "Side effect: terminate active billing recovery ladders for this period.",
      ],
    },
    suppression: {
      summary: "Receipt — always allow when payment succeeds.",
      details: [
        "Dedupe if CleanUp + PaymentStatusSync would both send RecCCApp.",
      ],
    },
    entryStepId: "start",
    steps: [
      {
        id: "start",
        kind: "start",
        label: "Payment succeeded",
        triggerKind: "event",
        triggerDetail: "Recurring payment / payment applied",
        note: "PaymentStatusSync / RecurringServicePayAuth / CleanUp",
        next: "clear-ladders",
      },
      {
        id: "clear-ladders",
        kind: "action",
        label: "Clear recovery enrollments",
        note: "Stop decline / ACH / invoice ladders for this period",
        next: "audience",
      },
      {
        id: "audience",
        kind: "branch",
        label: "Who to notify?",
        branches: [
          {
            id: "customer",
            label: "Customer receipt",
            condition: "RecCCApp",
            next: "confirm",
            tone: "success",
          },
          {
            id: "staff",
            label: "Staff notify",
            condition: "AEPayNotify",
            next: "staff-pay",
            tone: "neutral",
          },
        ],
      },
      {
        id: "confirm",
        kind: "email",
        label: "Payment confirmation",
        emailKey: "RecCCApp",
        subject: "Thank You for You Payment",
        note: "Catalog subject typo — fix in HubSpot redesign?",
        next: "exit",
      },
      {
        id: "staff-pay",
        kind: "email",
        label: "Internal: payment applied",
        emailKey: "AEPayNotify",
        subject: "@Customer.Name@ Payment Notification",
        note: "Internal staff",
        next: "exit",
      },
      {
        id: "exit",
        kind: "exit",
        label: "Payment notified",
        exitTone: "success",
      },
    ],
    emails: [
      {
        key: "RecCCApp",
        name: "Recurring Payment Confirmation",
        subject: "Thank You for You Payment",
        purpose: "Confirm successful recurring payment",
        trigger: "event",
        apps: [
          "PaymentStatusSync",
          "SMS.DM_CRM.RecurringServicePayAuth",
          "CleanUp",
        ],
        step: 1,
      },
      {
        key: "AEPayNotify",
        name: "Payment applied (internal)",
        subject: "@Customer.Name@ Payment Notification",
        purpose: "Notify staff that payment was applied",
        trigger: "event",
        apps: [
          "CRM",
          "CustomerPortal",
          "DM_Store",
          "OnlineSign",
          "PaymentStatusSync",
          "CleanUp",
        ],
      },
    ],
    openQuestions: [
      "Fix subject typo (You → Your)?",
      "Primary sender among the three apps?",
      "Do RecCCApp and AEPayNotify always fire together?",
    ],
  },

  // ─── 6. Refund issued ─────────────────────────────────────────────
  {
    id: "billing-refund",
    sequenceKey: "Billing.Refund",
    name: "Refund Issued",
    businessProcess: "Refund issued",
    departmentSlug: "billing",
    processType: "trigger",
    summary:
      "Customer refund confirmation (InvoiceRet) when a return/refund is issued. Branches to staff alert (CCREFUNDERR) when the CRM refund amount does not match the payment-processor refund.",
    sourceJobs: ["CRM", "CustomerPortal"],
    enrollment: {
      summary: "Customer (or order) for whom a refund has been issued or attempted.",
      details: [
        "Happy path: refund posted successfully → InvoiceRet to customer.",
        "Error path: BC/processor amount mismatch → CCREFUNDERR to internal staff.",
        "Stops invoice-collection pressure for the refunded invoice/order.",
      ],
    },
    start: {
      summary: "Refund issued or refund attempt fails amount check.",
      triggers: [
        "Event: Issued refund (InvoiceRet)",
        "Event: BC refund amount does not match refund amount sent (CCREFUNDERR)",
      ],
    },
    stop: {
      summary: "After customer refund notice or staff error alert sends.",
      details: [
        "STOP after InvoiceRet delivered to customer.",
        "STOP after CCREFUNDERR delivered to staff — ops resolves mismatch offline.",
        "Should suppress further InvRem1/2 for the refunded invoice.",
      ],
    },
    suppression: {
      summary: "Transactional refund path — do not mix with unpaid invoice reminders for the same order.",
      details: [
        "Exit or suppress Billing.InvoiceReminder for the refunded invoice/order.",
        "Does not suppress Card Decline / ACH ladders unless the same charge is reversed (confirm with Billing).",
        "Confirm primary sender: CRM vs CustomerPortal.",
      ],
    },
    entryStepId: "start",
    steps: [
      {
        id: "start",
        kind: "start",
        label: "Refund requested / processed",
        triggerKind: "event",
        triggerDetail: "Issued refund or amount mismatch",
        note: "CRM / CustomerPortal",
        next: "amount-check",
      },
      {
        id: "amount-check",
        kind: "branch",
        label: "Refund amounts match?",
        branches: [
          {
            id: "ok",
            label: "Yes — issued",
            condition: "CRM refund matches processor / BC refund",
            next: "customer-notice",
            tone: "success",
          },
          {
            id: "mismatch",
            label: "No — mismatch",
            condition: "BC refund amount ≠ refund amount sent",
            next: "staff-error",
            tone: "danger",
          },
        ],
      },
      {
        id: "customer-notice",
        kind: "email",
        label: "Customer refund notice",
        emailKey: "InvoiceRet",
        subject: "Your Refund Has Been Processed",
        note: "Catalog orphan — Dynamic Media Return / Issued Refund",
        next: "clear-invoice",
      },
      {
        id: "clear-invoice",
        kind: "action",
        label: "Stop invoice reminders for this order",
        note: "Suppress InvRem ladder for refunded invoice",
        next: "exit-customer",
      },
      {
        id: "staff-error",
        kind: "email",
        label: "Staff refund error alert",
        emailKey: "CCREFUNDERR",
        subject: "CC Partial Refund Error for OrderID: @Order.OrderID@",
        note: "Internal — amount mismatch; do not send InvoiceRet until resolved",
        next: "exit-staff",
      },
      {
        id: "exit-customer",
        kind: "exit",
        label: "Customer notified",
        exitTone: "success",
      },
      {
        id: "exit-staff",
        kind: "exit",
        label: "Ops resolving mismatch",
        note: "After fix, re-run happy path → InvoiceRet",
        exitTone: "danger",
      },
    ],
    emails: [
      {
        key: "InvoiceRet",
        name: "Dynamic Media Return - Issued Refund",
        subject: "Your Refund Has Been Processed",
        purpose: "Notify customer that a refund has been issued",
        trigger: "event",
        apps: ["CRM", "CustomerPortal"],
        step: 1,
      },
      {
        key: "CCREFUNDERR",
        name: "CC Partial Refund Error",
        subject: "CC Partial Refund Error for OrderID: @Order.OrderID@",
        purpose:
          "Internal alert when BC refund amount does not match refund amount sent",
        trigger: "event",
        apps: ["CRM", "CustomerPortal"],
        step: 2,
      },
    ],
    openQuestions: [
      "Primary sender for InvoiceRet (CRM vs CustomerPortal)?",
      "After CCREFUNDERR is fixed, does InvoiceRet auto-fire or need a re-trigger?",
      "Should partial refunds still stop the full InvRem ladder?",
    ],
  },
];

export const BILLING_PROGRAM = {
  slug: "billing",
  name: "Billing",
  description:
    "Card decline recovery, card expiration, invoice collection, ACH rejection, payment confirmation, and refunds.",
  sequenceNamespace: "Billing.*",
  conflictPriority: [
    "billing-card-decline-recovery",
    "billing-invoice-collection",
    "billing-card-expiration",
  ] as const,
  relatedUnscopedKeys: [] as { key: string; note: string }[],
};
