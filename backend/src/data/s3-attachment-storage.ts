import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { AttachmentObject, AttachmentStorage, StoreAttachmentInput, StoredAttachment } from './attachment-storage';

export class S3AttachmentStorage implements AttachmentStorage {
  private readonly client = new S3Client({ region: env.AWS_REGION });

  constructor(private readonly bucket = env.S3_ATTACHMENTS_BUCKET) {}

  async store(input: StoreAttachmentInput): Promise<StoredAttachment> {
    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `tickets/${input.ticketId}/${Date.now()}-${safeFileName}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      Body: input.buffer,
      ContentType: input.mimeType,
      ServerSideEncryption: 'AES256'
    }));
    return { storageKey };
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }), { expiresIn: 900 });
  }

  async getObject(storageKey: string): Promise<AttachmentObject> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }));
    const bytes = result.Body ? await result.Body.transformToByteArray() : new Uint8Array();
    return { buffer: Buffer.from(bytes), mimeType: result.ContentType };
  }
}
