// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';

// 指向上面的 request 檔案（路徑相對於專案根目錄）
const withNextIntl = createNextIntlPlugin('./src/app/i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true
};

export default withNextIntl(nextConfig);
