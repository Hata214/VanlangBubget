// Dữ liệu fallback mặc định cho trang chủ
import homepageVi from './homepage-vi';
import homepageEn from './homepage-en';

// Tập hợp tất cả dữ liệu fallback
export const localFallbackData: Record<string, any> = {
    // Trang chủ
    'homepage-vi': homepageVi,
    'homepage-en': homepageEn,

    // Các trang khác sẽ được thêm sau
    'about-vi': {},
    'about-en': {},
    'features-vi': {},
    'features-en': {},
    'contact-vi': {},
    'contact-en': {},
    'roadmap-vi': {},
    'roadmap-en': {},
    'pricing-vi': {},
    'pricing-en': {},
};

// Export các section riêng lẻ để sử dụng khi cần
export {
    homepageVi,
    homepageEn
}; 