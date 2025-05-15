/**
 * Script để đồng bộ hình ảnh từ frontend vào backend
 * Sao chép các hình ảnh từ thư mục public/images vào thư mục tương ứng trong backend
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Cấu hình
const FRONTEND_IMAGES_DIR = path.join(__dirname, '../../public/images');
const BACKEND_UPLOAD_ENDPOINT = 'http://localhost:4000/api/admin/upload/image';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

// Danh sách các thư mục con cần đồng bộ
const SUBDIRECTORIES = [
  'logos',
  'homepage',
  'features',
  'about',
  'roadmap',
  'pricing',
  'contact',
  'testimonials',
  'team',
  'partners',
  'icons'
];

/**
 * Kiểm tra xem một file có phải là hình ảnh không
 * @param {string} filename Tên file
 * @returns {boolean} True nếu là hình ảnh
 */
const isImageFile = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
};

/**
 * Đọc tất cả các file hình ảnh trong một thư mục
 * @param {string} directory Đường dẫn đến thư mục
 * @returns {Array<string>} Danh sách đường dẫn đến các file hình ảnh
 */
const getImagesFromDirectory = (directory) => {
  try {
    if (!fs.existsSync(directory)) {
      console.log(`Thư mục không tồn tại: ${directory}`);
      return [];
    }

    const files = fs.readdirSync(directory);
    const imagePaths = [];

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // Đệ quy vào thư mục con
        const subImages = getImagesFromDirectory(filePath);
        imagePaths.push(...subImages);
      } else if (isImageFile(file)) {
        imagePaths.push(filePath);
      }
    }

    return imagePaths;
  } catch (error) {
    console.error(`Lỗi khi đọc thư mục ${directory}:`, error);
    return [];
  }
};

/**
 * Tải lên một hình ảnh lên backend
 * @param {string} imagePath Đường dẫn đến file hình ảnh
 * @returns {Promise<string>} URL của hình ảnh sau khi tải lên
 */
const uploadImage = async (imagePath) => {
  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(imagePath);
    const fileName = path.basename(imagePath);
    
    // Lấy đường dẫn tương đối từ thư mục public/images
    const relativePath = path.relative(FRONTEND_IMAGES_DIR, imagePath);
    const directory = path.dirname(relativePath);
    
    formData.append('image', fileStream, fileName);
    formData.append('directory', directory === '.' ? '' : directory);

    const response = await axios.post(BACKEND_UPLOAD_ENDPOINT, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (response.data && response.data.url) {
      return response.data.url;
    } else {
      throw new Error('Không nhận được URL hình ảnh từ API');
    }
  } catch (error) {
    console.error(`Lỗi khi tải lên hình ảnh ${imagePath}:`, error.message);
    throw error;
  }
};

/**
 * Đồng bộ tất cả hình ảnh trong một thư mục
 * @param {string} directory Đường dẫn đến thư mục
 * @returns {Promise<Array<{path: string, url: string}>>} Danh sách các hình ảnh đã đồng bộ
 */
const syncImagesInDirectory = async (directory) => {
  console.log(`Đang đồng bộ hình ảnh trong thư mục: ${directory}`);
  
  const imagePaths = getImagesFromDirectory(directory);
  console.log(`Tìm thấy ${imagePaths.length} hình ảnh trong thư mục ${directory}`);
  
  const results = [];
  
  for (const imagePath of imagePaths) {
    try {
      console.log(`Đang tải lên: ${imagePath}`);
      const url = await uploadImage(imagePath);
      console.log(`Đã tải lên thành công: ${imagePath} -> ${url}`);
      
      results.push({
        path: imagePath,
        url: url
      });
    } catch (error) {
      console.error(`Không thể tải lên hình ảnh ${imagePath}:`, error.message);
    }
  }
  
  return results;
};

/**
 * Đồng bộ tất cả hình ảnh trong các thư mục con
 * @returns {Promise<void>}
 */
const syncAllImages = async () => {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ HÌNH ẢNH ===');
  console.log('Thời gian bắt đầu:', new Date().toLocaleString());
  console.log('');
  
  const allResults = [];
  
  // Đồng bộ hình ảnh trong thư mục gốc
  const rootResults = await syncImagesInDirectory(FRONTEND_IMAGES_DIR);
  allResults.push(...rootResults);
  
  // Đồng bộ hình ảnh trong các thư mục con
  for (const subdir of SUBDIRECTORIES) {
    const subdirPath = path.join(FRONTEND_IMAGES_DIR, subdir);
    
    if (fs.existsSync(subdirPath)) {
      const subdirResults = await syncImagesInDirectory(subdirPath);
      allResults.push(...subdirResults);
    } else {
      console.log(`Thư mục con không tồn tại: ${subdirPath}`);
    }
  }
  
  console.log('');
  console.log(`Đã đồng bộ tổng cộng ${allResults.length} hình ảnh`);
  
  // Tạo file mapping để sử dụng sau này
  const mapping = {};
  for (const result of allResults) {
    const relativePath = path.relative(FRONTEND_IMAGES_DIR, result.path);
    mapping[`/images/${relativePath.replace(/\\/g, '/')}`] = result.url;
  }
  
  // Lưu mapping vào file JSON
  const mappingPath = path.join(__dirname, 'image-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`Đã lưu mapping hình ảnh vào file: ${mappingPath}`);
  
  console.log('');
  console.log('=== ĐỒNG BỘ HÌNH ẢNH HOÀN TẤT ===');
  console.log('Thời gian kết thúc:', new Date().toLocaleString());
};

/**
 * Cập nhật URL hình ảnh trong dữ liệu nội dung
 * @param {Object} content Dữ liệu nội dung
 * @param {Object} mapping Mapping từ đường dẫn cũ sang URL mới
 * @returns {Object} Dữ liệu nội dung đã cập nhật
 */
const updateImageUrlsInContent = (content, mapping) => {
  if (!content || typeof content !== 'object') {
    return content;
  }
  
  const result = Array.isArray(content) ? [] : {};
  
  for (const key in content) {
    const value = content[key];
    
    if (typeof value === 'string' && (value.startsWith('/images/') || value.includes('/images/'))) {
      // Đây là URL hình ảnh, cập nhật nếu có trong mapping
      result[key] = mapping[value] || value;
    } else if (typeof value === 'object') {
      // Đệ quy vào object con
      result[key] = updateImageUrlsInContent(value, mapping);
    } else {
      // Giữ nguyên giá trị
      result[key] = value;
    }
  }
  
  return result;
};

// Xuất các hàm để sử dụng trong các script khác
module.exports = {
  syncAllImages,
  updateImageUrlsInContent,
  getImagesFromDirectory,
  uploadImage
};

// Nếu script được chạy trực tiếp
if (require.main === module) {
  syncAllImages().catch(error => {
    console.error('Lỗi khi đồng bộ hình ảnh:', error);
    process.exit(1);
  });
}
