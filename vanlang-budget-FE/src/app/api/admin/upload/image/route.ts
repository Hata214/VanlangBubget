import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * API endpoint để tải lên hình ảnh
 * @route POST /api/admin/upload/image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const directory = formData.get('directory') as string || '';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Không có file được tải lên' },
        { status: 400 }
      );
    }

    // Kiểm tra loại file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Loại file không hợp lệ. Chỉ chấp nhận JPEG, PNG, GIF, WEBP và SVG' },
        { status: 400 }
      );
    }

    // Giới hạn kích thước file (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'Kích thước file quá lớn. Tối đa 5MB' },
        { status: 400 }
      );
    }

    // Tạo tên file duy nhất
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Tạo đường dẫn thư mục lưu trữ
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images', directory);
    
    // Đảm bảo thư mục tồn tại
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Đường dẫn đầy đủ đến file
    const filePath = join(uploadDir, fileName);

    // Đọc nội dung file
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Ghi file vào hệ thống
    await writeFile(filePath, fileBuffer);

    // Tạo URL tương đối
    const relativePath = join('/uploads/images', directory, fileName).replace(/\\/g, '/');

    // Trả về URL của file đã tải lên
    return NextResponse.json({
      success: true,
      url: relativePath,
      message: 'Tải lên hình ảnh thành công'
    });
  } catch (error) {
    console.error('Lỗi khi tải lên hình ảnh:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tải lên hình ảnh' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint để lấy danh sách hình ảnh
 * @route GET /api/admin/upload/image
 */
export async function GET(request: NextRequest) {
  try {
    // Trong thực tế, bạn sẽ lấy danh sách hình ảnh từ cơ sở dữ liệu hoặc hệ thống file
    // Ở đây, chúng ta sẽ trả về một danh sách mẫu
    const images = [
      '/uploads/images/logo.png',
      '/uploads/images/hero.jpg',
      '/uploads/images/feature1.png',
      '/uploads/images/feature2.png',
      '/uploads/images/feature3.png',
    ];

    return NextResponse.json(images);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hình ảnh:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy danh sách hình ảnh' },
      { status: 500 }
    );
  }
}
