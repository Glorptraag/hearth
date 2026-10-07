/**
 * Route-change entrance for every signed-in screen (motion spec §"Page
 * transitions"). Next.js re-mounts a template on each navigation, so the fade
 * replays every time the parent lands on a new page — layouts, by contrast,
 * persist and would only animate once.
 *
 * The wrapper is a column flex so a page root that asks for `flex-1` (the
 * Logger, whose sticky save bar needs the form to fill the viewport) still
 * can. `min-w-0` keeps a horizontal scroller inside a page from widening the
 * column (see CLAUDE.md › Accessibility › flex layout columns).
 */
export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  return <div className="hearth-page-enter flex min-h-full min-w-0 flex-col">{children}</div>;
}
