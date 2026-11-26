// `filename` is an ASCII fallback for old clients; `filename*` (RFC 5987)
// carries the real UTF-8 name, e.g. "Результат сна.pdf".
export function attachment(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const utf8 = encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}
