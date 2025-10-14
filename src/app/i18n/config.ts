// app/i18n/config.ts
export const locales = ['en', 'zh-Hant'] as const;
export type Locale = (typeof locales)[number];

// 你若有預設語系需要共用也可以匯出
export const defaultLocale: Locale = 'zh-Hant';
