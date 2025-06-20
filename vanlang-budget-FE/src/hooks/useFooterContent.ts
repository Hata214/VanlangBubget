import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

interface FooterContent {
    companyName: string;
    description: string;
    product1: string;
    product2: string;
    product3: string;
    product4: string;
    company1: string;
    company2: string;
    company3: string;
    company4: string;
    support1: string;
    support2: string;
    support3: string;
    support4: string;
    legal1: string;
    legal2: string;
    legal3: string;
    copyright: string;
    socialFacebook: string;
    socialTwitter: string;
    socialLinkedin: string;
    socialInstagram: string;
    // Social URLs
    socialFacebookUrl: string;
    socialTwitterUrl: string;
    socialLinkedinUrl: string;
    socialInstagramUrl: string;
    socialGithubUrl: string;
}

export const useFooterContent = () => {
    const [content, setContent] = useState<FooterContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const locale = useLocale();

    useEffect(() => {
        const fetchFooterContent = async () => {
            try {
                setLoading(true);
                console.log('🦶 Fetching footer content for locale:', locale);

                // Sử dụng route chung thay vì route riêng để tránh vấn đề
                const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vanlangbubget.onrender.com'}/api/site-content/footer`;
                console.log('📡 Footer API URL:', apiUrl);

                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`Failed to fetch footer content: ${response.status}`);
                }

                const data = await response.json();
                console.log('📥 Received footer data:', data);

                // Lấy content theo locale hiện tại
                // getFooterContent trả về: { status: 'success', data: { vi: {...}, en: {...} } }
                // Kiểm tra cả hai structure có thể có
                let localeContent;
                if (data.data && typeof data.data === 'object') {
                    // Nếu data.data có structure { vi: {...}, en: {...} }
                    localeContent = data.data[locale] || data.data.vi;
                } else {
                    // Nếu data.data là null hoặc không có structure mong đợi
                    localeContent = null;
                }
                console.log('🌐 Footer locale content:', localeContent);

                setContent(localeContent);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching footer content:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');

                // Fallback content
                const fallbackContent = {
                    companyName: 'VanLang Budget',
                    description: locale === 'en'
                        ? 'Smart personal finance management app that helps you track expenses and achieve your financial goals.'
                        : 'Ứng dụng quản lý tài chính cá nhân thông minh, giúp bạn theo dõi chi tiêu và đạt được mục tiêu tài chính.',
                    product1: locale === 'en' ? 'Expense Tracking' : 'Quản lý chi tiêu',
                    product2: locale === 'en' ? 'Budget Planning' : 'Lập ngân sách',
                    product3: locale === 'en' ? 'Financial Reports' : 'Báo cáo tài chính',
                    product4: locale === 'en' ? 'Savings Goals' : 'Mục tiêu tiết kiệm',
                    company1: locale === 'en' ? 'About Us' : 'Về chúng tôi',
                    company2: locale === 'en' ? 'Contact' : 'Liên hệ',
                    company3: locale === 'en' ? 'Careers' : 'Tuyển dụng',
                    company4: locale === 'en' ? 'News' : 'Tin tức',
                    support1: locale === 'en' ? 'Help Center' : 'Trung tâm hỗ trợ',
                    support2: locale === 'en' ? 'User Guide' : 'Hướng dẫn sử dụng',
                    support3: 'FAQ',
                    support4: locale === 'en' ? 'Report Bug' : 'Báo lỗi',
                    legal1: locale === 'en' ? 'Terms of Service' : 'Điều khoản sử dụng',
                    legal2: locale === 'en' ? 'Privacy Policy' : 'Chính sách bảo mật',
                    legal3: locale === 'en' ? 'Cookie Policy' : 'Chính sách cookie',
                    copyright: locale === 'en'
                        ? '© 2024 VanLang Budget. All rights reserved.'
                        : '© 2024 VanLang Budget. Tất cả quyền được bảo lưu.',
                    socialFacebook: 'Facebook',
                    socialTwitter: 'Twitter',
                    socialLinkedin: 'LinkedIn',
                    socialInstagram: 'Instagram',
                    // Default social URLs
                    socialFacebookUrl: 'https://facebook.com/vanlangbudget',
                    socialTwitterUrl: 'https://twitter.com/vanlangbudget',
                    socialLinkedinUrl: 'https://linkedin.com/company/vanlangbudget',
                    socialInstagramUrl: 'https://instagram.com/vanlangbudget',
                    socialGithubUrl: 'https://github.com/vanlangbudget'
                };
                console.log('🔄 Using footer fallback content:', fallbackContent);
                setContent(fallbackContent);
            } finally {
                setLoading(false);
            }
        };

        fetchFooterContent();
    }, [locale]);

    return { content, loading, error };
};
