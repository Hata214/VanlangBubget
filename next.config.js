/** @type {import('next').NextConfig} */
// === UNIFIED NEXT.JS CONFIG FOR VANLANG BUDGET PROJECT ===
// Gộp từ root và frontend next.config.js

const withNextIntl = require('next-intl/plugin')(
    // Thêm cấu hình next-intl
    './src/i18n.ts'
);

const nextConfig = {
    reactStrictMode: false, // Đổi thành false để tránh render hai lần trong môi trường dev
    swcMinify: true,
    experimental: {
        // appDir: true, // Removed - deprecated in Next.js 14
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
    skipTrailingSlashRedirect: true,
    // Disable ở chế độ dev để dễ debug
    distDir: process.env.NODE_ENV === 'development' ? '.next' : '.next',
    async rewrites() {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        return [
            // Quy tắc này đảm bảo các route /api/auth/* không bị rewrite bởi quy tắc sau
            // Nó rewrite về chính nó, nhưng Next.js sẽ ưu tiên API route handler nếu có
            {
                source: '/api/auth/:path*',
                destination: '/api/auth/:path*', // Không rewrite đến backend
            },
            // Quy tắc rewrite cho investments API
            {
                source: '/api/investments/:path*',
                destination: `${API_URL}/api/investments/:path*`,
            },
            // Quy tắc rewrite cho investments API (không có path)
            {
                source: '/api/investments',
                destination: `${API_URL}/api/investments`,
            },
            // Quy tắc rewrite các API khác đến backend
            {
                source: '/api/:path*', // Sẽ không khớp với /api/auth/* do quy tắc trên
                destination: `${API_URL}/api/:path*`
            }
        ]
    },
    // Removed i18n config - conflicts with next-intl in App Router
    // i18n: {
    //     locales: ['vi', 'en'],
    //     defaultLocale: 'vi',
    //     localeDetection: false
    // }
}

module.exports = withNextIntl(nextConfig)