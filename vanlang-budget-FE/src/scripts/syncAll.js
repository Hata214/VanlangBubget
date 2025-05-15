/**
 * Script chính để chạy tất cả các script đồng bộ
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Tạo interface để đọc input từ người dùng
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== ĐỒNG BỘ DỮ LIỆU VÀO ADMIN ===');
console.log('');
console.log('Có hai phương pháp đồng bộ dữ liệu:');
console.log('1. Đồng bộ từ các file fallback (dữ liệu mẫu)');
console.log('2. Đồng bộ trực tiếp từ frontend đang chạy (khuyến nghị)');
console.log('');

rl.question('Vui lòng chọn phương pháp đồng bộ (1 hoặc 2): ', async (answer) => {
  try {
    // Đường dẫn đến các script
    const imagesScript = path.join(__dirname, 'syncImages.js');
    const contentScript = path.join(__dirname, 'syncContentToAdmin.js');
    const additionalScript = path.join(__dirname, 'syncAdditionalContent.js');
    const frontendScript = path.join(__dirname, 'syncFromFrontend.js');

    console.log('');
    console.log('=== BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU ===');
    console.log('Thời gian bắt đầu:', new Date().toLocaleString());
    console.log('');

    if (answer === '2') {
      // Phương pháp 2: Đồng bộ trực tiếp từ frontend
      console.log('Bạn đã chọn đồng bộ trực tiếp từ frontend đang chạy.');
      console.log('');

      // Kiểm tra xem frontend có đang chạy không
      console.log('Đang kiểm tra xem frontend có đang chạy không...');
      try {
        execSync('curl -s http://localhost:3000 > nul');
        console.log('Frontend đang chạy trên cổng 3000.');
      } catch (error) {
        console.error('Lỗi: Frontend không chạy trên cổng 3000.');
        console.error('Vui lòng khởi động frontend trước khi tiếp tục.');
        rl.close();
        process.exit(1);
      }

      // Chạy script đồng bộ hình ảnh trước
      console.log('Đang chạy script đồng bộ hình ảnh...');
      execSync(`node "${imagesScript}"`, { stdio: 'inherit' });
      console.log('');

      // Chạy script đồng bộ từ frontend
      console.log('Đang chạy script đồng bộ từ frontend...');
      execSync(`node "${frontendScript}"`, { stdio: 'inherit' });
      console.log('');
    } else {
      // Phương pháp 1: Đồng bộ từ các file fallback
      console.log('Bạn đã chọn đồng bộ từ các file fallback (dữ liệu mẫu).');
      console.log('');

      // Chạy script đồng bộ hình ảnh trước
      console.log('Đang chạy script đồng bộ hình ảnh...');
      execSync(`node "${imagesScript}"`, { stdio: 'inherit' });
      console.log('');

      // Kiểm tra xem file mapping hình ảnh đã được tạo chưa
      const imageMappingPath = path.join(__dirname, 'image-mapping.json');
      if (!fs.existsSync(imageMappingPath)) {
        console.warn('Cảnh báo: Không tìm thấy file mapping hình ảnh. Dữ liệu nội dung sẽ không được cập nhật URL hình ảnh.');
      } else {
        console.log('Đã tìm thấy file mapping hình ảnh. Dữ liệu nội dung sẽ được cập nhật với URL hình ảnh mới.');

        // Thiết lập biến môi trường để các script khác biết về file mapping
        process.env.IMAGE_MAPPING_PATH = imageMappingPath;
      }

      // Chạy script đồng bộ dữ liệu cơ bản
      console.log('Đang chạy script đồng bộ dữ liệu cơ bản...');
      execSync(`node "${contentScript}"`, { stdio: 'inherit' });
      console.log('');

      // Chạy script đồng bộ dữ liệu bổ sung
      console.log('Đang chạy script đồng bộ dữ liệu bổ sung...');
      execSync(`node "${additionalScript}"`, { stdio: 'inherit' });
      console.log('');
    }

    console.log('=== ĐỒNG BỘ DỮ LIỆU HOÀN TẤT ===');
    console.log('Thời gian kết thúc:', new Date().toLocaleString());
    console.log('');
    console.log('Tất cả dữ liệu đã được đồng bộ thành công!');
    console.log('Bây giờ bạn có thể truy cập giao diện admin để xem và chỉnh sửa nội dung.');
    rl.close();
  } catch (error) {
    console.error('=== LỖI KHI ĐỒNG BỘ DỮ LIỆU ===');
    console.error('Chi tiết lỗi:', error.message);
    console.error('');
    console.error('Vui lòng kiểm tra:');
    console.error('1. Backend đã được khởi động và đang chạy trên cổng 4000');
    console.error('2. Frontend đã được khởi động và đang chạy trên cổng 3000 (nếu đồng bộ từ frontend)');
    console.error('3. Các API endpoint trong script phù hợp với cấu hình backend');
    console.error('4. Cấu trúc dữ liệu gửi đi phù hợp với schema trong backend');
    console.error('5. Thư mục public/images tồn tại và có quyền truy cập');
    rl.close();
    process.exit(1);
  }
});
