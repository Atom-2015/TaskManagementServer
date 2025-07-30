const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UploadCloudinary = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    throw new Error("Buffer is empty or undefined");
  }


  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "users",
     
        upload_preset: "taskapplicaation",
      },
      (error, result) => {
        if (error) {
          console.error(">>> Cloudinary upload error:", error);
          return reject(error);
        }
        console.log(">>> Cloudinary upload success:", result.secure_url);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer)
      .on("error", (err) => {
        console.error(">>> Streamifier error:", err);
        reject(err);
      })
      .pipe(uploadStream);
  });
};


const uploadLeaveDoc = (buffer) => {
  if (!buffer?.length) throw new Error("Buffer is empty");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "leave",
        resource_type: "raw",
        use_filename: true,
        unique_filename: true,
         upload_preset: "taskapplicaation", // make sure preset allows raw, else remove
        allowed_formats: ["pdf", "doc", "docx", "odt"],
      },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};



module.exports = {UploadCloudinary,uploadLeaveDoc};
