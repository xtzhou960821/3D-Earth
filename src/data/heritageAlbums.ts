/**
 * Travel albums stay on the public xixia-heritage GitHub Pages site.
 * Do not vendor the ~860MB image tree (or full HTML album pages) into this repo.
 */
export const HERITAGE_PAGES_BASE =
  "https://xtzhou960821.github.io/xixia-heritage";

/**
 * Earth place id → public album page URL.
 * Only include clear matches; do not invent destinations.
 */
export const heritageAlbums: Readonly<Record<string, string>> = {
  huangshan: `${HERITAGE_PAGES_BASE}/huangshan.html`,
  potala: `${HERITAGE_PAGES_BASE}/tibet-lhasa.html`,
};

/**
 * Resolve the public album URL for a destination, if any.
 * @param placeId Earth place id
 * @returns Absolute album URL or undefined
 */
export function getHeritageAlbumUrl(placeId: string): string | undefined {
  return heritageAlbums[placeId];
}

/** Catalog entries for the thin `/heritage/` index (deep-links only). */
export const heritageCatalog: ReadonlyArray<{
  title: string;
  href: string;
  note?: string;
}> = [
  { title: "相册首页", href: `${HERITAGE_PAGES_BASE}/` },
  {
    title: "黄山",
    href: `${HERITAGE_PAGES_BASE}/huangshan.html`,
    note: "对应地球目的地「黄山」",
  },
  {
    title: "拉萨 · 布达拉宫",
    href: `${HERITAGE_PAGES_BASE}/tibet-lhasa.html`,
    note: "对应地球目的地「布达拉宫」",
  },
  { title: "贺兰山", href: `${HERITAGE_PAGES_BASE}/helan-mountain.html` },
  { title: "西夏陵", href: `${HERITAGE_PAGES_BASE}/xixia-tomb.html` },
  { title: "宝塔山", href: `${HERITAGE_PAGES_BASE}/baota-mountain.html` },
  { title: "壶口瀑布", href: `${HERITAGE_PAGES_BASE}/hukou-waterfall.html` },
  { title: "西藏阿里", href: `${HERITAGE_PAGES_BASE}/tibet-ali.html` },
  { title: "成都", href: `${HERITAGE_PAGES_BASE}/chengdu.html` },
  { title: "婺源", href: `${HERITAGE_PAGES_BASE}/wuyuan.html` },
];
