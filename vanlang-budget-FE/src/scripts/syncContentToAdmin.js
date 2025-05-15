/**
 * Script để đồng bộ dữ liệu từ frontend vào admin
 * Sử dụng dữ liệu từ các file fallback để tạo dữ liệu mẫu cho admin
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Import dữ liệu fallback
const homepageVi = require('../content/fallbacks/homepage-vi').default;
const homepageEn = require('../content/fallbacks/homepage-en').default;
const { localFallbackData } = require('../content/fallbacks/index');

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

// Đường dẫn đến các file JSON
const aboutJsonPath = path.join(__dirname, '../app/about.json');
const contactJsonPath = path.join(__dirname, '../app/contact.json');

// API Endpoints
const API_BASE_URL = 'http://localhost:4000/api';
const SITE_CONTENT_ENDPOINT = `${API_BASE_URL}/site-content`;

/**
 * Đọc file JSON
 * @param {string} filePath Đường dẫn đến file
 * @returns {Object} Dữ liệu JSON
 */
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Lỗi khi đọc file ${filePath}:`, error);
    return null;
  }
};

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
 * Đồng bộ dữ liệu trang chủ
 */
const syncHomepageContent = async () => {
  console.log('Đang đồng bộ dữ liệu trang chủ...');

  // Cập nhật URL hình ảnh trong dữ liệu
  const updatedHomepageVi = updateImageUrlsInContent(homepageVi);
  const updatedHomepageEn = updateImageUrlsInContent(homepageEn);

  // Đồng bộ dữ liệu tiếng Việt
  const homepageViResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/homepage`, {
    content: updatedHomepageVi,
    language: 'vi'
  });

  console.log('Kết quả đồng bộ trang chủ tiếng Việt:', homepageViResult ? 'Thành công' : 'Thất bại');

  // Đồng bộ dữ liệu tiếng Anh
  const homepageEnResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/homepage`, {
    content: updatedHomepageEn,
    language: 'en'
  });

  console.log('Kết quả đồng bộ trang chủ tiếng Anh:', homepageEnResult ? 'Thành công' : 'Thất bại');
};

/**
 * Đồng bộ dữ liệu trang Giới thiệu
 */
const syncAboutContent = async () => {
  console.log('Đang đồng bộ dữ liệu trang Giới thiệu...');

  // Đọc dữ liệu từ file JSON
  const aboutData = readJsonFile(aboutJsonPath) || localFallbackData['about-vi'];

  // Cập nhật URL hình ảnh trong dữ liệu
  const updatedAboutData = updateImageUrlsInContent(aboutData);

  // Đồng bộ dữ liệu tiếng Việt
  const aboutViResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/about`, {
    content: updatedAboutData,
    language: 'vi'
  });

  console.log('Kết quả đồng bộ trang Giới thiệu tiếng Việt:', aboutViResult ? 'Thành công' : 'Thất bại');

  // Tạo phiên bản tiếng Anh
  const aboutEnData = {
    title: "About Us",
    subtitle: "The Journey of VanLang Budget",
    description: "VanLang Budget was developed by a team of personal finance enthusiasts with the goal of helping people manage their finances more effectively.",
    mission: {
      title: "Our Mission",
      content: "To help people achieve financial freedom through smart and intuitive financial management tools."
    },
    vision: {
      title: "Our Vision",
      content: "To become the leading personal finance management application in Vietnam, helping millions of people control spending, save effectively, and achieve financial goals."
    },
    // Sao chép hình ảnh từ phiên bản tiếng Việt nếu có
    teamImage: updatedAboutData.teamImage,
    backgroundImage: updatedAboutData.backgroundImage,
    logoImage: updatedAboutData.logoImage
  };

  // Cập nhật URL hình ảnh trong dữ liệu tiếng Anh
  const updatedAboutEnData = updateImageUrlsInContent(aboutEnData);

  // Đồng bộ dữ liệu tiếng Anh
  const aboutEnResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/about`, {
    content: updatedAboutEnData,
    language: 'en'
  });

  console.log('Kết quả đồng bộ trang Giới thiệu tiếng Anh:', aboutEnResult ? 'Thành công' : 'Thất bại');
};

/**
 * Đồng bộ dữ liệu trang Tính năng
 */
const syncFeaturesContent = async () => {
  console.log('Đang đồng bộ dữ liệu trang Tính năng...');

  // Sử dụng dữ liệu từ fallback
  const featuresViData = localFallbackData['features-vi'];
  const featuresEnData = localFallbackData['features-en'];

  // Cập nhật URL hình ảnh trong dữ liệu
  const updatedFeaturesViData = updateImageUrlsInContent(featuresViData);
  const updatedFeaturesEnData = updateImageUrlsInContent(featuresEnData);

  // Đồng bộ dữ liệu tiếng Việt
  const featuresViResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/features`, {
    content: updatedFeaturesViData,
    language: 'vi'
  });

  console.log('Kết quả đồng bộ trang Tính năng tiếng Việt:', featuresViResult ? 'Thành công' : 'Thất bại');

  // Đồng bộ dữ liệu tiếng Anh
  const featuresEnResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/features`, {
    content: updatedFeaturesEnData,
    language: 'en'
  });

  console.log('Kết quả đồng bộ trang Tính năng tiếng Anh:', featuresEnResult ? 'Thành công' : 'Thất bại');
};

/**
 * Đồng bộ dữ liệu trang Liên hệ
 */
const syncContactContent = async () => {
  console.log('Đang đồng bộ dữ liệu trang Liên hệ...');

  // Đọc dữ liệu từ file JSON
  const contactData = readJsonFile(contactJsonPath) || {};

  // Cập nhật URL hình ảnh trong dữ liệu
  const updatedContactData = updateImageUrlsInContent(contactData);

  // Đồng bộ dữ liệu tiếng Việt
  const contactViResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/contact`, {
    content: updatedContactData,
    language: 'vi'
  });

  console.log('Kết quả đồng bộ trang Liên hệ tiếng Việt:', contactViResult ? 'Thành công' : 'Thất bại');

  // Tạo phiên bản tiếng Anh
  const contactEnData = {
    title: "Contact Us",
    subtitle: "We're here to help",
    description: "If you have any questions about VanLang Budget or need support, don't hesitate to contact us. Our support team is always ready to help you.",
    contactInfo: {
      email: contactData.contactInfo?.email || "support@vanglangbudget.com",
      phone: contactData.contactInfo?.phone || "+84 28 1234 5678",
      address: "123 Nguyen Van Linh, District 7, Ho Chi Minh City, Vietnam",
      workingHours: "Monday - Friday: 9:00 - 17:00"
    },
    // Sao chép hình ảnh từ phiên bản tiếng Việt nếu có
    mapImage: updatedContactData.mapImage,
    contactImage: updatedContactData.contactImage,
    backgroundImage: updatedContactData.backgroundImage
  };

  // Cập nhật URL hình ảnh trong dữ liệu tiếng Anh
  const updatedContactEnData = updateImageUrlsInContent(contactEnData);

  // Đồng bộ dữ liệu tiếng Anh
  const contactEnResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/contact`, {
    content: updatedContactEnData,
    language: 'en'
  });

  console.log('Kết quả đồng bộ trang Liên hệ tiếng Anh:', contactEnResult ? 'Thành công' : 'Thất bại');
};

/**
 * Hàm chính để đồng bộ tất cả dữ liệu
 */
const syncAllContent = async () => {
  console.log('Bắt đầu đồng bộ dữ liệu từ frontend vào admin...');

  try {
    await syncHomepageContent();
    await syncAboutContent();
    await syncFeaturesContent();
    await syncContactContent();

    console.log('Đồng bộ dữ liệu hoàn tất!');
  } catch (error) {
    console.error('Lỗi khi đồng bộ dữ liệu:', error);
  }
};

// Chạy hàm đồng bộ
syncAllContent();
