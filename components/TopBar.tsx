"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { LogOut, Moon, Sun } from "lucide-react";

/**
 * TopBar — fixed 56px header to the right of the sidebar.
 *
 * Carries the light/dark toggle and the user avatar menu. In the Sales
 * Research Engine this is a server-fed component (`TopBarServer` reads
 * the session and passes email/name/role down); in this starter the
 * props default to a placeholder user. When you add auth, feed real
 * values in and wire `onSignOut` to your provider's sign-out.
 */

interface TopBarProps {
  email?: string;
  name?: string | null;
}

/** Two-letter monogram from name, falling back to email local-part. */
function getInitials(name: string | null | undefined, email: string): string {
  const source = (name && name.trim()) || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TopBar({
  email = "teammate@dm-us.com",
  name = "DM Teammate",
}: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Close on click-outside and Escape. Handlers attach only while open
  // to avoid global listener churn.
  useEffect(() => {
    if (!menuOpen) return;

    function onDocumentClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setMenuOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const initials = getInitials(name, email);

  return (
    <header className="app-shell-topbar fixed top-0 left-60 right-0 z-40 h-14 border-b border-surface-border bg-surface-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-surface-secondary/80">
      <div className="flex h-full items-center justify-end gap-2 px-6">
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition hover:bg-accent-muted hover:text-accent"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        <div className="relative ml-1">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold uppercase text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-secondary"
          >
            {initials}
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              role="menu"
              aria-label="Account"
              className="absolute right-0 mt-2 w-64 origin-top-right rounded-md border border-surface-border bg-surface-elevated shadow-lg ring-1 ring-black/5 focus:outline-none"
            >
              <div className="px-4 py-3 border-b border-surface-border">
                {name && (
                  <p className="text-sm font-medium text-text-primary truncate">
                    {name}
                  </p>
                )}
                <p className="text-xs text-text-muted truncate">{email}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    // Placeholder — wire this to your auth provider's
                    // sign-out (e.g. NextAuth's signOut()).
                    toast("Sign-out isn't wired up in the starter.");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary transition hover:bg-accent-muted hover:text-accent"
                >
                  <LogOut size={15} strokeWidth={1.8} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
