export interface HotelReference {
  name: string;
  area: string;
  source: string;
}
// Curated references, checked 2026-09-05. These are not live availability or rankings.
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
};
