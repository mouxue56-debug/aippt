function normalizePath(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

function configuredBasePath(): string {
  return normalizePath(import.meta.env.BASE_URL || "/");
}

export function publicBaseHref(basePath = configuredBasePath()): string {
  const normalizedBase = normalizePath(basePath);
  return normalizedBase === "/" ? "/" : `${normalizedBase}/`;
}

export function publicRoute(
  pathname = window.location.pathname,
  hash = window.location.hash,
  basePath = configuredBasePath()
): string {
  if (hash.startsWith("#/")) return normalizePath(hash.slice(1));

  const normalizedPath = normalizePath(pathname);
  const normalizedBase = normalizePath(basePath);
  if (normalizedBase !== "/" && normalizedPath === normalizedBase) return "/";
  if (normalizedBase !== "/" && normalizedPath.startsWith(`${normalizedBase}/`)) {
    return normalizePath(normalizedPath.slice(normalizedBase.length));
  }
  return normalizedPath;
}

export function isPublicBuild(): boolean {
  return import.meta.env.VITE_AIPPT_PUBLIC_MODE === "1";
}

export function isToolsHomePath(
  pathname = window.location.pathname,
  hash = window.location.hash,
  publicBuild = isPublicBuild(),
  basePath = configuredBasePath()
): boolean {
  const route = publicRoute(pathname, hash, basePath);
  return route === "/tools" || (publicBuild && route === "/");
}

export function isStoryboardSlicerPath(pathname = window.location.pathname, hash = window.location.hash, basePath = configuredBasePath()): boolean {
  const route = publicRoute(pathname, hash, basePath);
  return route === "/storyboard-slicer" || route === "/tools/storyboard-slicer";
}

export function isPublicMode(
  pathname = window.location.pathname,
  hash = window.location.hash,
  publicBuild = isPublicBuild(),
  basePath = configuredBasePath()
): boolean {
  const route = publicRoute(pathname, hash, basePath);
  return publicBuild || route === "/tools" || route === "/aippt" || route.startsWith("/tools/");
}

export function editorHref(basePath = configuredBasePath(), pathname = window.location.pathname): string {
  const baseHref = publicBaseHref(basePath);
  if (normalizePath(basePath) === "/tools" || normalizePath(pathname).startsWith("/tools")) return "/tools/aippt";
  return `${baseHref}#/aippt`;
}

export function storyboardSlicerHref(basePath = configuredBasePath(), pathname = window.location.pathname): string {
  const baseHref = publicBaseHref(basePath);
  if (normalizePath(basePath) === "/tools" || normalizePath(pathname).startsWith("/tools")) return "/tools/storyboard-slicer";
  return `${baseHref}#/storyboard-slicer`;
}
