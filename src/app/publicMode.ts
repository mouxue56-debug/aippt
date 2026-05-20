export function isToolsHomePath(pathname = window.location.pathname): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === "/tools";
}

export function isPublicMode(pathname = window.location.pathname): boolean {
  return import.meta.env.VITE_AIPPT_PUBLIC_MODE === "1" || pathname === "/tools" || pathname.startsWith("/tools/");
}
