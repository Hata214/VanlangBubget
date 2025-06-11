const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vanlangbubget.onrender.com',
        pathname: '/uploads/**',
      },
    ],
  },
  // Disable locale prefix in URLs
  i18n: undefined,
};

module.exports = withNextIntl(nextConfig);
