import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'auto',
      });
      
      // Remove the temporary file after upload
      fs.unlinkSync(file.path);
      
      return result.secure_url;
    } catch (error) {
      // Make sure to clean up the temporary file in case of error
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }
}