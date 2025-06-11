import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

interface HeaderContent {
    logo: string;
    nav1: string;
    nav2: string;
    nav3: string;
    nav4: string;
    nav5: string; // Thêm nav5
    loginButton: string;
    signupButton: string;
    userMenuProfile: string;
    userMenuSettings: string;
    userMenuLogout: string;
}

export const useHeaderContent = () => {
    const [content, setContent] = useState<HeaderContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const locale = useLocale();

    useEffect(() => {
        const fetchHeaderContent = async () => {
            try {
                setLoading(true);
                console.log('🔄 Fetching header content for locale:', locale);

                const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/site-content/header`;
                console.log('📡 API URL:', apiUrl);

                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`Failed to fetch header content: ${response.status}`);
                }

                const data = await response.json();
                console.log('📥 Received header data:', data);

                // Lấy content theo locale hiện tại
                // API trả về structure: { status: 'success', data: { vi: {...}, en: {...} } }
                const localeContent = data.data?.[locale] || data.data?.vi;
                console.log('🌐 Locale content:', localeContent);

                setContent(localeContent);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching header content:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');

                // Fallback content
                const fallbackContent = {
                    logo: 'VanLang Budget',
                    nav1: locale === 'en' ? 'About Us' : 'Về chúng tôi',
                    nav2: locale === 'en' ? 'Features' : 'Tính năng',
                    nav3: locale === 'en' ? 'Pricing' : 'Bảng giá',
                    nav4: locale === 'en' ? 'Contact' : 'Liên hệ',
                    nav5: locale === 'en' ? 'Roadmap' : 'Lộ trình', // Thêm nav5 vào fallback
                    loginButton: locale === 'en' ? 'Login' : 'Đăng nhập',
                    signupButton: locale === 'en' ? 'Sign Up' : 'Đăng ký',
                    userMenuProfile: locale === 'en' ? 'Profile' : 'Hồ sơ',
                    userMenuSettings: locale === 'en' ? 'Settings' : 'Cài đặt',
                    userMenuLogout: locale === 'en' ? 'Logout' : 'Đăng xuất'
                };
                console.log('🔄 Using fallback content:', fallbackContent);
                setContent(fallbackContent);
            } finally {
                setLoading(false);
            }
        };

        fetchHeaderContent();
    }, [locale]);

    return { content, loading, error };
};
