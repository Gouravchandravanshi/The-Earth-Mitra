require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({

  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
  api_key: process.env.CLOUDINARY_API_KEY ,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return callback(new Error("Only image files are accepted"));
    }
    callback(null, true);
  },
});

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (public_id) => {
  return await cloudinary.uploader.destroy(public_id);
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
