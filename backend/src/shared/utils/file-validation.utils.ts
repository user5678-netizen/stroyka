import { BadRequestException } from '@nestjs/common';

export const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return callback(
      new BadRequestException('Only image files are allowed'),
      false,
    );
  }
  callback(null, true);
};

export const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 10, // Max 10 files
};

export const validateUploadedFiles = (files: Express.Multer.File[]): void => {
  if (!files || files.length === 0) {
    throw new BadRequestException('No files uploaded');
  }

  if (files.length < 3) {
    throw new BadRequestException('Minimum 3 images required');
  }

  // Validate each file
  files.forEach((file) => {
    if (file.size > limits.fileSize) {
      throw new BadRequestException(
        `File ${file.originalname} exceeds size limit of 5MB`,
      );
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `File ${file.originalname} is not an image`,
      );
    }
  });
};