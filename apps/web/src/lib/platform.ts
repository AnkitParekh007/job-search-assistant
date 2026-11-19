/** Browser shims for APIs that are native-only on desktop. */

export async function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function revealItemInDir(_path: string) {
  // No Finder/Explorer in the browser.
  return;
}

export async function open(_opts?: {
  directory?: boolean;
  title?: string;
  defaultPath?: string;
}): Promise<string | null> {
  const next = window.prompt(
    _opts?.title || "Enter a local workspace path (stored in this browser only)",
    _opts?.defaultPath || ""
  );
  return next && next.trim() ? next.trim() : null;
}
