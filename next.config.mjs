// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560, 3840],
    qualities: [75, 85, 100],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;



