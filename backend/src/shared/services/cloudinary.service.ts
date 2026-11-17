import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

/** Корневая папка товарных изображений в Cloudinary. */
export const PRODUCTS_FOLDER = 'stroyka/products';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get('CLOUDINARY_API_KEY'),
      api_secret: configService.get('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  /**
   * Загружает один файл и возвращает secure_url.
   * Изображения складываются в папку товара: stroyka/products/<slug>.
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = PRODUCTS_FOLDER,
    publicId?: string,
  ): Promise<string> {
    const options: UploadApiOptions = {
      folder,
      resource_type: 'image',
      overwrite: false,
      ...(publicId ? { public_id: publicId } : {}),
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error: unknown, result?: { secure_url: string }) => {
          if (error || !result) {
            reject(error instanceof Error ? error : new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result.secure_url);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /** Загружает пакет файлов, сохраняя порядок и раскладывая их в одну папку. */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = PRODUCTS_FOLDER,
  ): Promise<string[]> {
    const batch = Date.now();
    return Promise.all(
      files.map((file, index) =>
        this.uploadImage(
          file,
          folder,
          `${batch}-${String(index + 1).padStart(2, '0')}`,
        ),
      ),
    );
  }

  /**
   * Загружает изображение по URL. Если URL уже ведёт на Cloudinary,
   * возвращает его без повторной загрузки.
   */
  async uploadFromUrl(
    url: string,
    folder: string = PRODUCTS_FOLDER,
  ): Promise<string> {
    if (url.includes('res.cloudinary.com')) {
      return url;
    }

    const result = await cloudinary.uploader.upload(url, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  async deleteImageByUrl(url: string): Promise<void> {
    const publicId = this.extractPublicIdFromUrl(url);
    if (publicId) {
      await this.deleteImage(publicId);
    }
  }

  extractPublicIdFromUrl(url: string): string | null {
    try {
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}
