import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

/**
 * Route-group layout for pages that live inside the app shell (fixed
 * sidebar + top bar). The `(shell)` segment is a route group — the
 * parentheses exclude it from the URL, so pages keep their natural
 * paths. Anything that shouldn't have chrome (a sign-in page, a print
 * view) lives outside this group.
 *
 * The inline critical CSS guarantees a sane fallback shell if the
 * Tailwind stylesheet fails to load.
 */
const CRITICAL_SHELL_CSS = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0}
.app-shell-sidebar{position:fixed;inset:0 auto 0 0;width:15rem;z-index:50;overflow-y:auto;border-right:1px solid #dedede;background:#f6f6f8}
.app-shell-main{margin-left:15rem;min-height:100vh;padding-top:5rem;padding-right:2rem;padding-bottom:2rem;padding-left:2rem;box-sizing:border-box}
html.dark .app-shell-sidebar{border-color:#2e2e2e;background:#202020}
`;

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_SHELL_CSS }} />
      <Sidebar />
      <TopBar />
      <main className="app-shell-main ml-60 min-h-screen bg-surface-primary px-8 pt-20 pb-8">
        {children}
      </main>
    </>
  );
}
