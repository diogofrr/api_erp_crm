import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class R2Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string = 'application/pdf',
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  }

  async getSignedUrl(
    fileName: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(fileName: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    });

    await this.s3Client.send(command);
  }

  async uploadLogo(
    fileBuffer: Buffer,
    eventId: string,
    contentType: string = 'image/png',
  ): Promise<string> {
    const fileName = `logos/event-${eventId}-${Date.now()}.png`;
    return await this.uploadFile(fileBuffer, fileName, contentType);
  }

  async deleteLogo(logoUrl: string): Promise<void> {
    if (!logoUrl) return;

    const fileName = logoUrl.split('/').pop();
    if (fileName) {
      await this.deleteFile(`logos/${fileName}`);
    }
  }
}
