export interface HotelReference {
  name: string;
  area: string;
  source: string;
}
/**
 * Public hotel pages for reference.
 * Each source URL is the authority for that stay; this is not one shared audit date, and not live rates.
 */
export const hotels: Record<string, HotelReference> = {
  jiuzhai: {
    name: "九寨绿发希尔顿度假酒店",
    area: "漳扎镇 · 景区沟口住宿区域",
    source:
      "https://www.hilton.com/zh-hans/hotels/jzhjihi-hilton-jiuzhaigou-resort/",
  },
  palace: {
    name: "北京王府半岛酒店",
    area: "王府井金鱼胡同 · 故宫周边城区",
    source:
      "https://www.peninsula.com/zh-cn/beijing/5-star-luxury-hotel-wangfujing",
  },
  zhangjiajie: {
    name: "张家界京武铂尔曼酒店",
    area: "武陵源 · 高云路",
    source: "https://all.accor.com/hotel/7934/index.en.shtml",
  },
  westlake: {
    name: "杭州君悦酒店",
    area: "西湖东岸 · 湖滨商圈",
    source:
      "https://www.hyatt.com/grand-hyatt/zh-CN/hangz-grand-hyatt-hangzhou",
  },
  huangshan: {
    name: "黄山白云宾馆",
    area: "黄山天海景区 · 山顶住宿",
    source: "https://hsgwh.huangshan.gov.cn/lyfw/bgjd/jqnjd/9096939.html",
  },
  greatwall: {
    name: "北京八达岭希尔顿逸林酒店",
    area: "延庆城区 · 前往长城需乘车",
    source:
      "https://www.hilton.com.cn/zh-CN/hotels/bjsbddi-doubletree-by-hilton-beijing-badaling",
  },
  terracotta: {
    name: "西安临潼悦椿温泉酒店",
    area: "临潼区 · 前往兵马俑需乘车",
    source: "https://www.angsana.com/cn/china/xian-lintong",
  },
  guilin: {
    name: "阳朔悦榕庄",
    area: "阳朔 · 漓江沿岸度假区域",
    source: "https://www.banyantree.com/cn/china/yangshuo",
  },
  potala: {
    name: "拉萨香格里拉",
    area: "罗布林卡路 · 拉萨市区",
    source: "https://www.shangri-la.com/cn/lhasa/shangrila/about/",
  },
  bund: {
    name: "上海和平饭店",
    area: "外滩 · 南京东路",
    source:
      "https://www.fairmont.com/zh/hotels/shanghai/fairmont-peace-hotel.html",
  },
  dunhuang: {
    name: "敦煌山庄",
    area: "敦煌城区南侧 · 前往莫高窟需乘车",
    source:
      "https://www.chinabound.cn/s/202601/19/WS696e06dc498e23165e06cded/silk-road-dunhuang-hotel.html",
  },
  lijiang: {
    name: "丽江和府洲际度假酒店",
    area: "大研古城南端 · 古城住宿",
    source:
      "https://www.ihg.com.cn/intercontinental/hotels/cn/zh/lijiang/ljgac/hoteldetail",
  },
  helan: {
    name: "银川凯宾斯基饭店",
    area: "金凤区 · 前往贺兰山需乘车",
    source: "https://www.kempinski.com/cn/kempinski-hotel-yinchuan",
  },
  xixia: {
    name: "银川希尔顿酒店",
    area: "金凤区 · 前往西夏陵需乘车",
    source: "https://www.hilton.com.cn/zh-CN/hotels/incychi-hilton-yinchuan/",
  },
  baota: {
    name: "如家酒店（延安宝塔山万达广场店）",
    area: "宝塔区 · 邻近宝塔山与城区",
    source: "https://www.bthhotels.com/hotel/091105",
  },
  hukou: {
    name: "延安宝塔山景区慧泽山庄华驿精选酒店",
    area: "延安城区 · 前往壶口瀑布需乘车",
    source: "https://www.bthhotels.com/hotel/AY1773",
  },
  ali: {
    name: "拉萨香格里拉（进藏中转参考）",
    area: "拉萨市区 · 阿里行程常经拉萨中转",
    source: "https://www.shangri-la.com/cn/lhasa/shangrila/about/",
  },
  chengdu: {
    name: "成都香格里拉大酒店",
    area: "锦江滨河 · 成都城区",
    source: "https://www.shangri-la.com/cn/chengdu/shangrila/about/",
  },
  wuyuan: {
    name: "篁岭景区住宿（竹山度假方向）",
    area: "婺源篁岭 · 景区内/近景区住宿",
    source: "https://www.wyhl.cc/",
  },
  tongjiang: {
    name: "如家精选（台州市仙居吾悦广场店）",
    area: "仙居城区 · 前往皤滩 / 桐江书院需乘车",
    source: "https://www.bthhotels.com/hotel/J57601",
  },
  jinan: {
    name: "济南怡豪大饭店（泉城广场大明湖店）",
    area: "历下区泺源大街 · 步行可至芙蓉街与泉城广场",
    source: "https://jinansilverplaza.sofitels.cn/",
  },
  qingdao: {
    name: "青岛香格里拉",
    area: "香港中路 · 五四广场，前往奥帆中心需短途",
    source: "https://www.shangri-la.com/cn/qingdao/shangrila/about/",
  },
};
