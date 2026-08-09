import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor() {
    // Inicializamos Cloudinary con las variables de tu .env
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Esta función recibe el archivo desde React y lo sube a la nube
  uploadFile(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ovalo-fans', // Crea una carpeta adentro de Cloudinary para ser ordenados
          resource_type: 'auto', // Permite subir fotos y videos automáticamente
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      // Usamos streamifier para leer el buffer del archivo que llegó a la memoria del server
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}