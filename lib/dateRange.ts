export type Preset = "30d" | "90d";
export function rangeFor(preset: Preset, now = new Date()) {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); // midnight UTC
  const days = preset === "90d" ? 90 : 30;
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - (days - 1));
  return { from, to };
}
export function parseFromTo(search: URLSearchParams) {
  const from = search.get("from");
  const to = search.get("to");
  return {
    from: from ? new Date(from) : null,
    to: to ? new Date(to) : null,
  };
}