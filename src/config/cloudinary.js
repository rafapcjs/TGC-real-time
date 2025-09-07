import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (file, filename) => {
  try {
    let uploadData;
    
    if (Buffer.isBuffer(file)) {
      // Para buffers, convertir a base64
      uploadData = `data:image/jpeg;base64,${file.toString('base64')}`;
    } else {
      // Para rutas de archivo
      uploadData = file;
    }
    
    const result = await cloudinary.uploader.upload(uploadData, {
      folder: 'incidents',
      resource_type: 'auto',
      public_id: filename ? filename.split('.')[0] : undefined
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Error uploading file to Cloudinary');
  }
};

export default cloudinary;