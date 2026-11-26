import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

export async function normalizeAvatar(file?: Express.Multer.File) {
  if (!file) throw new BadRequestException({ type: 'invalid-photo' });
  try {
    const img = sharp(file.buffer);
    const { format } = await img.metadata();
    if (!format || !['jpeg', 'png', 'tiff'].includes(format)) {
      throw new Error('unsupported');
    }
    return await img
      .rotate() // apply EXIF orientation
      .resize(512, 512, { fit: 'cover' })
      .jpeg({ quality: 85 }) // output carries no EXIF/GPS metadata
      .toBuffer();
  } catch {
    throw new BadRequestException({ type: 'invalid-photo' });
  }
}
