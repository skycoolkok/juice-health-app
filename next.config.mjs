// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/app/i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    // 二選一：domains 或 remotePatterns
    // domains: ['res.cloudinary.com', 'images.unsplash.com', 'i.imgur.com'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      // 如果你的圖放自己站上（例如 /images/xxx.jpg），則不需要設定
    ],
  },
};

export default withNextIntl(nextConfig);
