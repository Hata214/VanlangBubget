/**
 * Script để đồng bộ dữ liệu bổ sung từ frontend vào admin
 * Tập trung vào trang Roadmap và Pricing
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// API Endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://vanlangbubget.onrender.com';
const SITE_CONTENT_ENDPOINT = `${API_BASE_URL}/api/site-content`;

// Import hàm cập nhật URL hình ảnh
let updateImageUrlsInContent = (content) => content; // Mặc định không làm gì
let imageMapping = {};

// Kiểm tra xem có file mapping hình ảnh không
const imageMappingPath = process.env.IMAGE_MAPPING_PATH || path.join(__dirname, 'image-mapping.json');
if (fs.existsSync(imageMappingPath)) {
  try {
    imageMapping = JSON.parse(fs.readFileSync(imageMappingPath, 'utf8'));
    console.log(`Đã tải mapping hình ảnh từ ${imageMappingPath}`);
    console.log(`Số lượng hình ảnh trong mapping: ${Object.keys(imageMapping).length}`);

    // Định nghĩa hàm cập nhật URL hình ảnh
    updateImageUrlsInContent = (content) => {
      if (!content || typeof content !== 'object') {
        return content;
      }

      const result = Array.isArray(content) ? [] : {};

      for (const key in content) {
        const value = content[key];

        if (typeof value === 'string' && (value.startsWith('/images/') || value.includes('/images/'))) {
          // Đây là URL hình ảnh, cập nhật nếu có trong mapping
          result[key] = imageMapping[value] || value;
        } else if (typeof value === 'object') {
          // Đệ quy vào object con
          result[key] = updateImageUrlsInContent(value);
        } else {
          // Giữ nguyên giá trị
          result[key] = value;
        }
      }

      return result;
    };
  } catch (error) {
    console.error(`Lỗi khi đọc file mapping hình ảnh: ${error.message}`);
    console.warn('Sẽ sử dụng URL hình ảnh gốc.');
  }
} else {
  console.warn('Không tìm thấy file mapping hình ảnh. Sẽ sử dụng URL hình ảnh gốc.');
}

/**
 * Gửi dữ liệu lên API
 * @param {string} endpoint Endpoint API
 * @param {Object} data Dữ liệu cần gửi
 * @returns {Promise} Kết quả từ API
 */
const postToApi = async (endpoint, data) => {
  try {
    const response = await axios.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi gửi dữ liệu đến ${endpoint}:`, error.message);
    return null;
  }
};

/**
 * Đồng bộ dữ liệu trang Lộ trình
 */
const syncRoadmapContent = async () => {
  console.log('Đang đồng bộ dữ liệu trang Lộ trình...');

  // Dữ liệu mẫu cho trang Lộ trình tiếng Việt
  const roadmapViData = {
    title: "Lộ trình phát triển",
    subtitle: "Kế hoạch phát triển của VanLang Budget",
    description: "Chúng tôi liên tục cải tiến và phát triển VanLang Budget để mang đến trải nghiệm tốt nhất cho người dùng. Dưới đây là lộ trình phát triển của chúng tôi trong thời gian tới.",
    milestones: [
      {
        date: "Q1 2024",
        title: "Ra mắt phiên bản 1.0",
        description: "Phát hành phiên bản đầu tiên với các tính năng cơ bản: theo dõi thu chi, lập ngân sách, báo cáo đơn giản.",
        completed: true
      },
      {
        date: "Q2 2024",
        title: "Tích hợp quản lý khoản vay",
        description: "Thêm tính năng quản lý các khoản vay, tính toán lãi suất và lịch trả nợ.",
        completed: false
      },
      {
        date: "Q3 2024",
        title: "Tích hợp đầu tư",
        description: "Thêm tính năng theo dõi đầu tư vàng, chứng khoán và tiền điện tử.",
        completed: false
      },
      {
        date: "Q4 2024",
        title: "Ứng dụng di động",
        description: "Phát hành ứng dụng di động cho iOS và Android với đầy đủ tính năng như phiên bản web.",
        completed: false
      }
    ],
    upcomingFeatures: [
      {
        title: "Tích hợp ngân hàng",
        description: "Kết nối trực tiếp với tài khoản ngân hàng để tự động cập nhật giao dịch.",
        estimatedRelease: "2025"
      },
      {
        title: "Tư vấn tài chính AI",
        description: "Sử dụng trí tuệ nhân tạo để phân tích chi tiêu và đưa ra gợi ý tiết kiệm.",
        estimatedRelease: "2025"
      },
      {
        title: "Chia sẻ tài chính gia đình",
        description: "Cho phép nhiều thành viên trong gia đình cùng quản lý tài chính chung.",
        estimatedRelease: "2025"
      }
    ]
  };

  // Dữ liệu mẫu cho trang Lộ trình tiếng Anh
  const roadmapEnData = {
    title: "Development Roadmap",
    subtitle: "VanLang Budget Development Plan",
    description: "We continuously improve and develop VanLang Budget to provide the best experience for users. Below is our development roadmap for the coming period.",
    milestones: [
      {
        date: "Q1 2024",
        title: "Version 1.0 Launch",
        description: "Release of the first version with basic features: expense tracking, budgeting, simple reports.",
        completed: true
      },
      {
        date: "Q2 2024",
        title: "Loan Management Integration",
        description: "Add loan management features, interest calculation, and repayment schedules.",
        completed: false
      },
      {
        date: "Q3 2024",
        title: "Investment Integration",
        description: "Add features to track gold, stock, and cryptocurrency investments.",
        completed: false
      },
      {
        date: "Q4 2024",
        title: "Mobile Application",
        description: "Release mobile applications for iOS and Android with all the features of the web version.",
        completed: false
      }
    ],
    upcomingFeatures: [
      {
        title: "Bank Integration",
        description: "Direct connection to bank accounts for automatic transaction updates.",
        estimatedRelease: "2025"
      },
      {
        title: "AI Financial Advisor",
        description: "Use artificial intelligence to analyze spending and provide savings suggestions.",
        estimatedRelease: "2025"
      },
      {
        title: "Family Finance Sharing",
        description: "Allow multiple family members to manage shared finances together.",
        estimatedRelease: "2025"
      }
    ]
  };

  // Cập nhật URL hình ảnh trong dữ liệu
  const updatedRoadmapViData = updateImageUrlsInContent(roadmapViData);
  const updatedRoadmapEnData = updateImageUrlsInContent(roadmapEnData);

  // Đồng bộ dữ liệu tiếng Việt
  const roadmapViResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/roadmap`, {
    content: updatedRoadmapViData,
    language: 'vi'
  });

  console.log('Kết quả đồng bộ trang Lộ trình tiếng Việt:', roadmapViResult ? 'Thành công' : 'Thất bại');

  // Đồng bộ dữ liệu tiếng Anh
  const roadmapEnResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/roadmap`, {
    content: updatedRoadmapEnData,
    language: 'en'
  });

  console.log('Kết quả đồng bộ trang Lộ trình tiếng Anh:', roadmapEnResult ? 'Thành công' : 'Thất bại');
};

/**
 * Đồng bộ dữ liệu trang Bảng giá
 */
const syncPricingContent = async () => {
  console.log('Đang đồng bộ dữ liệu trang Bảng giá...');

  // Dữ liệu mẫu cho trang Bảng giá tiếng Việt
  const pricingViData = {
    title: "Bảng giá",
    subtitle: "Lựa chọn gói phù hợp với nhu cầu của bạn",
    description: "VanLang Budget cung cấp nhiều gói dịch vụ khác nhau để đáp ứng nhu cầu của mọi người dùng, từ cá nhân đến doanh nghiệp nhỏ.",
    plans: [
      {
        name: "Cơ bản",
        price: "0",
        currency: "VND",
        period: "tháng",
        description: "Dành cho người mới bắt đầu quản lý tài chính cá nhân",
        features: [
          "Theo dõi thu chi cơ bản",
          "Lập ngân sách đơn giản",
          "Báo cáo hàng tháng",
          "Hỗ trợ qua email"
        ],
        cta: "Bắt đầu miễn phí",
        popular: false
      },
      {
        name: "Tiêu chuẩn",
        price: "99.000",
        currency: "VND",
        period: "tháng",
        description: "Dành cho cá nhân muốn quản lý tài chính chuyên nghiệp",
        features: [
          "Tất cả tính năng cơ bản",
          "Báo cáo chi tiết",
          "Quản lý khoản vay",
          "Theo dõi đầu tư",
          "Hỗ trợ 24/7"
        ],
        cta: "Đăng ký ngay",
        popular: true
      },
      {
        name: "Cao cấp",
        price: "199.000",
        currency: "VND",
        period: "tháng",
        description: "Dành cho gia đình và doanh nghiệp nhỏ",
        features: [
          "Tất cả tính năng tiêu chuẩn",
          "Tư vấn tài chính cá nhân",
          "Đồng bộ hóa với ngân hàng",
          "Chia sẻ tài chính gia đình",
          "Ưu tiên hỗ trợ kỹ thuật"
        ],
        cta: "Liên hệ bán hàng",
        popular: false
      }
    ],
    faq: [
      {
        question: "Tôi có thể nâng cấp hoặc hạ cấp gói dịch vụ không?",
        answer: "Có, bạn có thể dễ dàng nâng cấp hoặc hạ cấp gói dịch vụ bất kỳ lúc nào. Thay đổi sẽ có hiệu lực vào đầu chu kỳ thanh toán tiếp theo."
      },
      {
        question: "Có cam kết hoàn tiền không?",
        answer: "Có, chúng tôi cung cấp cam kết hoàn tiền trong 30 ngày đầu tiên nếu bạn không hài lòng với dịch vụ."
      }
    ]
  };

  // Dữ liệu mẫu cho trang Bảng giá tiếng Anh
  const pricingEnData = {
    title: "Pricing",
    subtitle: "Choose a plan that fits your needs",
    description: "VanLang Budget offers various service packages to meet the needs of all users, from individuals to small businesses.",
    plans: [
      {
        name: "Basic",
        price: "0",
        currency: "USD",
        period: "month",
        description: "For beginners in personal finance management",
        features: [
          "Basic expense tracking",
          "Simple budgeting",
          "Monthly reports",
          "Email support"
        ],
        cta: "Start for free",
        popular: false
      },
      {
        name: "Standard",
        price: "4.99",
        currency: "USD",
        period: "month",
        description: "For individuals who want professional financial management",
        features: [
          "All basic features",
          "Detailed reports",
          "Loan management",
          "Investment tracking",
          "24/7 support"
        ],
        cta: "Sign up now",
        popular: true
      },
      {
        name: "Premium",
        price: "9.99",
        currency: "USD",
        period: "month",
        description: "For families and small businesses",
        features: [
          "All standard features",
          "Personal financial advice",
          "Bank synchronization",
          "Family finance sharing",
          "Priority technical support"
        ],
        cta: "Contact sales",
        popular: false
      }
    ],
    faq: [
      {
        question: "Can I upgrade or downgrade my service package?",
        answer: "Yes, you can easily upgrade or downgrade your service package at any time. Changes will take effect at the beginning of the next billing cycle."
      },
      {
        question: "Is there a money-back guarantee?",
        answer: "Yes, we provide a 30-day money-back guarantee if you are not satisfied with the service."
      }
    ]
  };

  // Cập nhật URL hình ảnh trong dữ liệu
  const updatedPricingViData = updateImageUrlsInContent(pricingViData);
  const updatedPricingEnData = updateImageUrlsInContent(pricingEnData);

  // Đồng bộ dữ liệu tiếng Việt
  const pricingViResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/pricing`, {
    content: updatedPricingViData,
    language: 'vi'
  });

  console.log('Kết quả đồng bộ trang Bảng giá tiếng Việt:', pricingViResult ? 'Thành công' : 'Thất bại');

  // Đồng bộ dữ liệu tiếng Anh
  const pricingEnResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/pricing`, {
    content: updatedPricingEnData,
    language: 'en'
  });

  console.log('Kết quả đồng bộ trang Bảng giá tiếng Anh:', pricingEnResult ? 'Thành công' : 'Thất bại');
};

/**
 * Hàm chính để đồng bộ tất cả dữ liệu bổ sung
 */
const syncAdditionalContent = async () => {
  console.log('Bắt đầu đồng bộ dữ liệu bổ sung từ frontend vào admin...');

  try {
    await syncRoadmapContent();
    await syncPricingContent();

    console.log('Đồng bộ dữ liệu bổ sung hoàn tất!');
  } catch (error) {
    console.error('Lỗi khi đồng bộ dữ liệu bổ sung:', error);
  }
};

// Chạy hàm đồng bộ
syncAdditionalContent();
