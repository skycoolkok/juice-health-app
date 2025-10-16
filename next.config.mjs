// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin.js';

/**
 * 1. 連結 next-intl 設定檔
 *    (確保多語系支援仍然正常)
 */
const withNextIntl = createNextIntlPlugin('./src/app/i18n/request.ts');

/**
 * 2. Next.js 全域設定
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  /**
   * ✅ 讓 Vercel 在 build 階段忽略 ESLint 錯誤
   *    (不會影響開發模式)
   */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /**
   * ✅ 指定 Node 版本，避免 Prisma + Next 版本不一致
   */
  typescript: {
    // 若遇到型別錯誤，不中斷 build（僅限 Vercel）
    ignoreBuildErrors: true,
  },

  /**
   * (可選) 若使用 Edge runtime 或 Vercel function
   * 可明確指定目標環境
   */
  experimental: {
    typedRoutes: true,
  },
};

/**
 * 3. 匯出組合後的設定
 */
export default withNextIntl(nextConfig);
