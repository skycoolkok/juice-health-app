import { type Locale } from "@/app/i18n/config";

export type RecipeTranslation = {
  name?: string;
  description?: string;
  category?: string | null;
};

const zhTranslations: Record<number, RecipeTranslation> = {
  3: {
    name: "胡蘿蔔柳橙汁",
    category: "美容排毒",
  },
  4: {
    name: "鳳梨薄荷沁涼飲",
    category: "清爽",
    description: "鳳梨搭配薄荷與椰子水，迅速補水降溫。",
  },
  5: {
    name: "柑橘紅蘿蔔亮膚飲",
    category: "美容",
    description: "紅蘿蔔、柳橙與薑帶來維生素 A 與 C 的好氣色。",
  },
  6: {
    name: "綠拿鐵排毒飲",
    category: "排毒",
    description: "羽衣甘藍、小黃瓜與萊姆幫助調整消化。",
  },
  7: {
    name: "薑香甜菜循環飲",
    category: "活力",
    description: "甜菜與薑帶來暖身循環，收尾帶點胡椒香。",
  },
  8: {
    name: "莓果抗氧活力飲",
    category: "免疫",
    description: "混合莓果與奇亞籽，補足抗氧化營養與纖維。",
  },
  9: {
    name: "椰香補水輕飲",
    category: "補水",
    description: "椰子水、小黃瓜與萊姆，隨時補充電解質。",
  },
  10: {
    name: "橙薑黃防護飲",
    category: "免疫",
    description: "柳橙、紅蘿蔔與薑黃打造金色護盾，黑胡椒提升吸收。",
  },
  11: {
    name: "抹茶梨醒腦飲",
    category: "晨間",
    description: "抹茶與梨子結合菠菜，帶來清爽咖啡因。",
  },
  12: {
    name: "西瓜羅勒清涼飲",
    category: "清涼",
    description: "西瓜搭配羅勒與萊姆，夏日退火首選。",
  },
  13: {
    name: "香料地瓜雪昔",
    category: "修復",
    description: "烤地瓜、肉桂與杏仁奶，運動後溫和補給。",
  },
  14: {
    name: "葡萄豆奶能量飲",
    category: "活力",
    description: "葡萄與豆奶加上亞麻籽，提供蛋白質與 Omega-3。",
  },
  15: {
    name: "蘋果芹菜清爽飲",
    category: "日常",
    description: "蘋果、芹菜與巴西里清爽解膩。",
  },
  16: {
    name: "花生香蕉修復飲",
    category: "修復",
    description: "花生醬、香蕉與燕麥，提供飽足與蛋白質。",
  },
};

export function getRecipeTranslation(id: number, locale: Locale): RecipeTranslation | null {
  if (locale === "zh-Hant") {
    return zhTranslations[id] ?? null;
  }
  return null;
}
