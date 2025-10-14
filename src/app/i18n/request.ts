// i18n/request.ts
import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  // 你專案提供的語系
  const supported = ['en', 'zh-Hant'] as const;
  type Supported = (typeof supported)[number];

  // 型別守衛：把任意輸入縮小成 Supported
  const isSupported = (x: unknown): x is Supported =>
    typeof x === 'string' && (supported as readonly string[]).includes(x as string);

  // 非法或空值時，一律退回 'zh-Hant'
  const lang: Supported = isSupported(locale) ? locale : 'zh-Hant';

  return {
    locale: lang,
    messages: (await import(`./messages/${lang}.json`)).default
  };
});
