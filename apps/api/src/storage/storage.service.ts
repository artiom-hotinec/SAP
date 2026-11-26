import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { mkdir, stat, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { resolve, sep } from 'path';

@Injectable()
export class StorageService {
  private readonly root = resolve(process.env.UPLOADS_DIR ?? 'uploads');

  private path(key: string): string {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep))
      throw new Error('Invalid storage key');
    return path;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const path = this.path(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async get(key: string) {
    const path = this.path(key);
    await stat(path).catch(() => {
      throw new NotFoundException();
    });
    return createReadStream(path);
  }

  async delete(key: string) {
    await rm(this.path(key), { force: true });
  }
}
