/**
 * Travel albums stay on the public xixia-heritage GitHub Pages site.
 * Do not vendor the ~860MB image tree (or full HTML album pages) into this repo.
 */
export const HERITAGE_PAGES_BASE =
  "https://xtzhou960821.github.io/xixia-heritage";

/**
 * Earth place id → public album page URL.
 * Only map destinations that have a real public `*.html` on xixia-heritage.
 * Public album pages today: helan-mountain, xixia-tomb, baota-mountain,
 * hukou-waterfall, tibet-ali, chengdu, huangshan, wuyuan, tibet-lhasa,
 * tongjiang-academy; plus Tibet sub-albums listed as catalog-only.
 * No pages (do not invent): palace, greatwall, jiuzhai, westlake,
 * zhangjiajie, terracotta, guilin, bund, mogao, lijiang, etc.
 */
export const heritageAlbums: Readonly<Record<string, string>> = {
  huangshan: `${HERITAGE_PAGES_BASE}/huangshan.html`,
  potala: `${HERITAGE_PAGES_BASE}/tibet-lhasa.html`,
  helan: `${HERITAGE_PAGES_BASE}/helan-mountain.html`,
  xixia: `${HERITAGE_PAGES_BASE}/xixia-tomb.html`,
  baota: `${HERITAGE_PAGES_BASE}/baota-mountain.html`,
  hukou: `${HERITAGE_PAGES_BASE}/hukou-waterfall.html`,
  ali: `${HERITAGE_PAGES_BASE}/tibet-ali.html`,
  chengdu: `${HERITAGE_PAGES_BASE}/chengdu.html`,
  wuyuan: `${HERITAGE_PAGES_BASE}/wuyuan.html`,
  tongjiang: `${HERITAGE_PAGES_BASE}/tongjiang-academy.html`,
};

/**
 * Resolve the public album URL for a destination, if any.
 * @param placeId Earth place id
 * @returns Absolute album URL or undefined
 */
export function getHeritageAlbumUrl(placeId: string): string | undefined {
  return heritageAlbums[placeId];
}

/**
 * Related public album pages that belong to a ring / circuit but are not
 * separate Earth destinations (deep-links only).
 */
export const relatedHeritageAlbums: Readonly<
  Record<string, ReadonlyArray<{ title: string; href: string }>>
> = {
  ali: [
    {
      title: "班公湖",
      href: `${HERITAGE_PAGES_BASE}/tibet-bangong.html`,
    },
    {
      title: "圣湖雪山",
      href: `${HERITAGE_PAGES_BASE}/tibet-sacred.html`,
    },
    {
      title: "扎达土林",
      href: `${HERITAGE_PAGES_BASE}/tibet-zhada.html`,
    },
  ],
};

/**
 * Related catalog-only album links for a place (e.g. Ali ring sub-pages).
 * @param placeId Earth place id
 */
export function getRelatedHeritageAlbums(
  placeId: string,
): ReadonlyArray<{ title: string; href: string }> {
  return relatedHeritageAlbums[placeId] ?? [];
}

/** Catalog entries for the thin `/heritage/` index (deep-links only). */
export const heritageCatalog: ReadonlyArray<{
  title: string;
  href: string;
  note?: string;
}> = [
  { title: "相册首页", href: `${HERITAGE_PAGES_BASE}/`, note: "全部旅程" },
  {
    title: "黄山",
    href: `${HERITAGE_PAGES_BASE}/huangshan.html`,
    note: "地球目的地互链",
  },
  {
    title: "拉萨 · 布达拉宫",
    href: `${HERITAGE_PAGES_BASE}/tibet-lhasa.html`,
    note: "地球目的地互链",
  },
  {
    title: "贺兰山",
    href: `${HERITAGE_PAGES_BASE}/helan-mountain.html`,
    note: "地球目的地互链",
  },
  {
    title: "西夏陵",
    href: `${HERITAGE_PAGES_BASE}/xixia-tomb.html`,
    note: "地球目的地互链",
  },
  {
    title: "宝塔山",
    href: `${HERITAGE_PAGES_BASE}/baota-mountain.html`,
    note: "地球目的地互链",
  },
  {
    title: "壶口瀑布",
    href: `${HERITAGE_PAGES_BASE}/hukou-waterfall.html`,
    note: "地球目的地互链",
  },
  {
    title: "西藏阿里",
    href: `${HERITAGE_PAGES_BASE}/tibet-ali.html`,
    note: "地球目的地互链",
  },
  {
    title: "成都",
    href: `${HERITAGE_PAGES_BASE}/chengdu.html`,
    note: "地球目的地互链",
  },
  {
    title: "婺源",
    href: `${HERITAGE_PAGES_BASE}/wuyuan.html`,
    note: "地球目的地互链",
  },
  {
    title: "桐江书院",
    href: `${HERITAGE_PAGES_BASE}/tongjiang-academy.html`,
    note: "地球目的地互链",
  },
  {
    title: "班公湖",
    href: `${HERITAGE_PAGES_BASE}/tibet-bangong.html`,
    note: "公开相册",
  },
  {
    title: "圣湖雪山",
    href: `${HERITAGE_PAGES_BASE}/tibet-sacred.html`,
    note: "公开相册",
  },
  {
    title: "扎达土林",
    href: `${HERITAGE_PAGES_BASE}/tibet-zhada.html`,
    note: "公开相册",
  },
];
