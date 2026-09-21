// Shared MapLibre style. The MapTiler key is injected at request time from
// REACT_APP_MAPTILER_KEY (set in .env.local) so it never lives in toner.json.
// Note: it still ends up in the browser bundle, so restrict the key to your
// domains in the MapTiler dashboard.
export const MAP_STYLE = `${process.env.PUBLIC_URL}/toner.json`;

const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;

export function transformRequest(url) {
  if (MAPTILER_KEY && url.startsWith("https://api.maptiler.com/")) {
    const sep = url.includes("?") ? "&" : "?";
    return { url: `${url}${sep}key=${MAPTILER_KEY}` };
  }
  return { url };
}
