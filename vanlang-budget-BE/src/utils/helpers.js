/**
 * Hàm formatCategoryName giúp chuẩn hóa tên danh mục từ tiếng Anh sang tiếng Việt
 * Được sử dụng ở nhiều controller để thống nhất hiển thị tên danh mục
 * 
 * @param {Object} category - Đối tượng danh mục cần định dạng
 * @returns {Object} - Đối tượng danh mục đã được định dạng lại tên
 */
export const formatCategoryName = (category) => {
    if (!category || typeof category !== 'object') return category;

    // Clone category để tránh thay đổi đối tượng gốc
    const formattedCategory = { ...category };

    // Ánh xạ danh mục tiếng Anh sang tiếng Việt
    const categoryMappings = {
        // Thu nhập
        'income': {
            'SALARY': 'Lương',
            'BONUS': 'Thưởng'
        },
        // Đầu tư
        'investment': {
            'INVESTMENT': 'Đầu tư'
        },
        // Thực phẩm
        'food': {
            'FOOD': 'Thực phẩm',
            'RESTAURANT': 'Nhà hàng',
            'GROCERIES': 'Tạp hóa'
        },
        // Giải trí
        'entertainment': {
            'ENTERTAINMENT': 'Giải trí',
            'MOVIE': 'Xem phim',
            'GAME': 'Trò chơi'
        },
        // Mua sắm
        'shopping': {
            'SHOPPING': 'Mua sắm',
            'CLOTHES': 'Quần áo',
            'ELECTRONICS': 'Điện tử'
        },
        // Đi lại
        'transportation': {
            'TRANSPORTATION': 'Đi lại',
            'TAXI': 'Taxi',
            'BUS': 'Xe buýt',
            'GAS': 'Xăng dầu'
        },
        // Nhà cửa
        'housing': {
            'RENT': 'Tiền thuê nhà',
            'UTILITIES': 'Tiện ích'
        },
        // Sức khỏe
        'health': {
            'MEDICAL': 'Y tế',
            'INSURANCE': 'Bảo hiểm'
        },
        // Giáo dục
        'education': {
            'EDUCATION': 'Giáo dục',
            'BOOKS': 'Sách'
        }
    };

    // Kiểm tra và thay đổi tên nếu tìm thấy trong ánh xạ
    if (category.group && categoryMappings[category.group] &&
        categoryMappings[category.group][category.name]) {
        formattedCategory.name = categoryMappings[category.group][category.name];
    }

    return formattedCategory;
}; 