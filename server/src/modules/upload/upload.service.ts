import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {S3} from "aws-sdk";
import {nanoid} from "nanoid";

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  private readonly s3: S3 = new S3({
    accessKeyId: this.configService.get("s3.accessKey"),
    secretAccessKey: this.configService.get("s3.secretAccessKey"),
  });

  upload(buffer: Buffer, mimetype: string): Promise<S3.ManagedUpload.SendData> {
    return new Promise((resolve) => {
      this.s3.upload(
        {
          ContentType: mimetype,
          Bucket: this.configService.get("s3.bucketName"),
          Key: nanoid(),
          Body: buffer,
        },
        (error, data) => {
          if (error) throw error;

          resolve(data);
        },
      );
    });
  }
}
