import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import { AttachmentObject, AttachmentStorage, StoreAttachmentInput, StoredAttachment } from './attachment-storage';

export class LocalAttachmentStorage implements AttachmentStorage {
  constructor(private readonly baseDir = env.LOCAL_ATTACHMENTS_DIR) {}

  async store(input: StoreAttachmentInput): Promise<StoredAttachment> {
    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = path.join('tickets', input.ticketId, `${Date.now()}-${safeFileName}`);
    const fullPath = path.join(this.baseDir, storageKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, input.buffer);
    return { storageKey };
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    return `/local-attachments/${encodeURIComponent(storageKey)}`;
  }

  async getObject(storageKey: string): Promise<AttachmentObject> {
    const fullPath = path.join(this.baseDir, storageKey);
    return { buffer: await fs.readFile(fullPath) };
  }
}
