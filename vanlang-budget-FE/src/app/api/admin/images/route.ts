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
    allImages.sort((a, b) => {
      try {
        const statsA = stat(join(publicDir, a));
        const statsB = stat(join(publicDir, b));
        return statsB.mtime.getTime() - statsA.mtime.getTime();
      } catch (error) {
        return 0;
      }
    });

    return NextResponse.json(allImages);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hình ảnh:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy danh sách hình ảnh' },
      { status: 500 }
    );
  }
}
