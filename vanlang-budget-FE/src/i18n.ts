import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Các ngôn ngữ được hỗ trợ
export const locales = ['vi', 'en'] as const;
export type Locale = (typeof locales)[number];

// Ngôn ngữ mặc định
export const defaultLocale = 'vi' as const;

export default getRequestConfig(async ({ locale, requestLocale }) => {
    // Xác định locale để sử dụng
    let resolvedLocale = locale || requestLocale || defaultLocale;

    // Nếu không có locale từ URL hoặc request, thử lấy từ localStorage hoặc cookie
    if (!locale && typeof window !== 'undefined') {
        const savedLocale = localStorage.getItem('preferred-locale');
        if (savedLocale && locales.includes(savedLocale as Locale)) {
            resolvedLocale = savedLocale;
        }
    }

    const typedLocale = resolvedLocale as string;

    // Validate locale
    if (!locales.includes(typedLocale as Locale)) {
        // Sử dụng locale mặc định thay vì notFound
        const messages = (await import(`./messages/${defaultLocale}.json`)).default;
        return {
            locale: defaultLocale,
            messages
        };
    }

    // Load messages
    try {
        const messages = (await import(`./messages/${typedLocale}.json`)).default;
        return {
            locale: typedLocale,
            messages
        };
    } catch (error) {
        console.error(`Could not load messages for locale "${typedLocale}"`, error);
        // Fallback to default locale
        const fallbackMessages = (await import(`./messages/${defaultLocale}.json`)).default;
        return {
            locale: defaultLocale,
            messages: fallbackMessages
        };
    }
});