// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';

// 你的 request 檔案路徑
const withNextIntl = createNextIntlPlugin('./src/app/i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // ✅ 部署時不要因 eslint 警告而失敗
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 如果未來 TS 也在建置時擋下來，可打開這個（目前先不用）
  // typescript: {
  //   ignoreBuildErrors: true,
  // },

  // ✅ 遠端圖片來源（依你實際用到的來源調整）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
