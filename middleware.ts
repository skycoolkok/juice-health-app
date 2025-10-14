// middleware.ts（專案根目錄）
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'zh-Hant'],
  defaultLocale: 'zh-Hant'
});

// 匹配所有非靜態與非 API 的請求，包含根路徑 '/'
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
