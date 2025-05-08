/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')(
    // Thêm cấu hình next-intl
    './src/i18n.ts'
);

const nextConfig = {
    reactStrictMode: false,
    swcMinify: true,
    experimental: {
        appDir: true,
    },
    output: 'standalone',
    poweredByHeader: false,
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost'
            },
            {
                protocol: 'https',
                hostname: process.env.NEXT_PUBLIC_API_DOMAIN || 'api-domain.com'
            }
        ]
    },
    env: {
        API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    },
    // Tắt kiểm tra TypeScript khi build
    typescript: {
        ignoreBuildErrors: true,
    },
    // Tắt kiểm tra ESLint khi build
    eslint: {
        ignoreDuringBuilds: true,
    },
    skipMiddlewareUrlNormalize: true,
    async rewrites() {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        return [
            {
                source: '/api/:path*',
                destination: `${API_URL}/api/:path*`
            }
        ]
    }
}

module.exports = withNextIntl(nextConfig) 