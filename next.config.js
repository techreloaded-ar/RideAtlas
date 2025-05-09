/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'images.unsplash.com'],
  },
  // Server Actions sono disponibili di default in Next.js 14.0.4
};

module.exports = nextConfig;