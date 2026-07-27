const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'smart-complaints',
  api_key: process.env.CLOUDINARY_API_KEY || '565856528721262',
  api_secret:
    process.env.CLOUDINARY_API_SECRET || '14llw_uwCGVPwJsSqfoJKqfBiZM',
});

/**
 * Upload a file buffer directly to Cloudinary with graceful fallback
 * @param {Buffer} fileBuffer Image file buffer
 * @param {string} folder Target folder in Cloudinary
 * @returns {Promise<string>} Secure URL of uploaded image
 */
const uploadToCloudinary = async (
  fileBuffer,
  folder = 'resolvedesk/complaints'
) => {
  try {
    const url = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(fileBuffer);
    });
    return url;
  } catch (err) {
    console.warn(
      '[Cloudinary Upload Notice]: Using base64 data URI fallback due to Cloudinary error:',
      err.message
    );
    const base64 = fileBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
