const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

if (process.env.CLOUDINARY_CLOUD_NAME === 'ScriptureLight') {
  console.warn('⚠️ WARNING: CLOUDINARY_CLOUD_NAME is set to "ScriptureLight". This is likely incorrect. Please find your actual Cloud Name in the Cloudinary Dashboard.');
}

const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'scripturelight/profiles',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

const bookStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'scripturelight/books',
    resource_type: 'raw', // for PDF, EPUB, etc.
  },
});

const uploadProfile = multer({ storage: profileStorage });
const uploadBook = multer({ storage: bookStorage });

module.exports = {
  cloudinary,
  uploadProfile,
  uploadBook
};
