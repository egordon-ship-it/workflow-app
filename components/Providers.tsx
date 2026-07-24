"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { ConfirmProvider } from "./ConfirmDialog";

/**
 * Client-side providers, mounted once in the root layout.
 *
 * - ThemeProvider: class-based dark mode (adds/removes `.dark` on <html>).
 *   Dark is the default; the TopBar toggle flips it.
 * - ConfirmProvider: branded confirm dialogs via `useConfirm()` —
 *   native window.confirm/alert/prompt are banned by ESLint.
 * - Toaster: react-hot-toast, styled with the surface tokens so toasts
 *   match light/dark automatically.
 *
 * If you add auth (e.g. NextAuth), wrap its SessionProvider around
 * everything here.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ConfirmProvider>{children}</ConfirmProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgb(var(--color-surface-elevated))",
            color: "rgb(var(--color-text-primary))",
            border: "1px solid rgb(var(--color-surface-border))",
            fontSize: "13px",
          },
        }}
      />
    </ThemeProvider>
  );
}
