import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

/**
 * Lấy tất cả các file hình ảnh trong một thư mục và các thư mục con
 * @param {string} dir Đường dẫn đến thư mục
 * @param {string} baseDir Đường dẫn cơ sở để tạo URL tương đối
 * @returns {Promise<string[]>} Danh sách URL tương đối của các file hình ảnh
 */
async function getImagesRecursive(dir: string, baseDir: string): Promise<string[]> {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const images: string[] = [];

  if (!existsSync(dir)) {
    return images;
  }

  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      // Đệ quy vào thư mục con
      const subDirImages = await getImagesRecursive(filePath, baseDir);
      images.push(...subDirImages);
    } else if (validExtensions.includes(extname(file).toLowerCase())) {
      // Tạo URL tương đối
      const relativePath = filePath.replace(baseDir, '').replace(/\\/g, '/');
      images.push(relativePath);
    }
  }

  return images;
}

/**
 * API endpoint để lấy danh sách hình ảnh
 * @route GET /api/admin/images
 */
export async function GET(request: NextRequest) {
  try {
    // Thư mục gốc chứa hình ảnh
    const publicDir = join(process.cwd(), 'public');

    // Các thư mục cần quét
    const directories = [
      join(publicDir, 'images'),
      join(publicDir, 'uploads', 'images')
    ];

    let allImages: string[] = [];

    // Quét từng thư mục
    for (const dir of directories) {
      if (existsSync(dir)) {
        const images = await getImagesRecursive(dir, publicDir);
        allImages = [...allImages, ...images];
      }
    }

    // Sắp xếp hình ảnh theo thời gian tạo (mới nhất trước)
    // Để sử dụng await trong hàm sort, chúng ta cần xử lý bất đồng bộ một cách cẩn thận
    // Tạo một mảng các promise để lấy thông tin stat cho tất cả các ảnh
    const statPromises = allImages.map(async (imagePath) => {
      try {
        const fullPath = join(publicDir, imagePath);
        const stats = await stat(fullPath);
        return { path: imagePath, mtime: stats.mtime.getTime() };
      } catch (error) {
        // Nếu không lấy được stat, coi như thời gian là 0 để đẩy xuống cuối
        console.error(`Error stating file ${imagePath}:`, error);
        return { path: imagePath, mtime: 0 };
      }
    });

    // Chờ tất cả các promise hoàn thành
    const imagesWithStats = await Promise.all(statPromises);

    // Sắp xếp dựa trên mtime đã lấy được
    imagesWithStats.sort((a, b) => b.mtime - a.mtime);

    // Lấy lại danh sách đường dẫn đã sắp xếp
    const sortedImages = imagesWithStats.map(item => item.path);

    return NextResponse.json(sortedImages);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hình ảnh:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy danh sách hình ảnh' },
      { status: 500 }
    );
  }
}
