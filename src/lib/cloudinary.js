// src/lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

/**
 * Upload a PDF buffer to Cloudinary
 * Returns { url, publicId, bytes }
 */
export async function uploadPDFToCloudinary(buffer, fileName) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',       // ✅ required for PDFs
        folder:        'gtu-ai/documents',
        public_id:     fileName.replace(/[^a-zA-Z0-9_-]/g, '_'),
        overwrite:     true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({
          url:      result.secure_url,
          publicId: result.public_id,
          bytes:    result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by publicId
 */
export async function deletePDFFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (err) {
    console.warn('[cloudinary] Delete failed:', err.message);
  }
}