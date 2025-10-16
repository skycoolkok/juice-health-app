// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin'; // ← 不要寫 .js

// 指向你的 request 檔案（相對於專案根目錄）
const withNextIntl = createNextIntlPlugin('./src/app/i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 讓 Vercel build 不因 ESLint 錯誤被中斷
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 讓 Vercel build 不因型別錯誤被中斷（本地仍可檢查）
  typescript: {
    ignoreBuildErrors: true,
  },

  // 可選：一些 Next 14 常用的實驗設定
  experimental: {
    typedRoutes: true,
  },
};

export default withNextIntl(nextConfig);

