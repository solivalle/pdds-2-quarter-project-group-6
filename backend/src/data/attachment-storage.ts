export interface StoreAttachmentInput {
  ticketId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface StoredAttachment {
  storageKey: string;
}

export interface AttachmentObject {
  buffer: Buffer;
  mimeType?: string;
}

export interface AttachmentStorage {
  store(input: StoreAttachmentInput): Promise<StoredAttachment>;
  getDownloadUrl(storageKey: string): Promise<string>;
  getObject(storageKey: string): Promise<AttachmentObject>;
}
