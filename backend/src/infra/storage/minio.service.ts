import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('minio.bucket')!;
    this.publicUrl = config.get<string>('minio.publicUrl')!;
    this.client = new Minio.Client({
      endPoint: config.get<string>('minio.endpoint')!,
      port: config.get<number>('minio.port')!,
      useSSL: false,
      accessKey: config.get<string>('minio.accessKey')!,
      secretKey: config.get<string>('minio.secretKey')!,
    });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async getPresignedUploadUrl(key: string, expiry = 3600): Promise<string> {
    return this.client.presignedPutObject(this.bucket, key, expiry);
  }

  async getPresignedDownloadUrl(key: string, expiry = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expiry);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  getClient(): Minio.Client {
    return this.client;
  }

  buildObjectUrl(key: string): string {
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }

  extractKey(url: string): string {
    const prefix = `${this.bucket}/`;
    const idx = url.indexOf(prefix);
    if (idx === -1) return '';
    return url.substring(idx + prefix.length);
  }
}
