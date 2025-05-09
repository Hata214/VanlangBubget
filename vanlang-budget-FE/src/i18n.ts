import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Các ngôn ngữ được hỗ trợ
export const locales = ['vi', 'en'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
    const typedLocale = locale as string;

    // Validate locale
    if (!locales.includes(typedLocale as Locale)) {
        notFound();
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
        return {
            locale: typedLocale,
            messages: {}
        };
    }
}); 