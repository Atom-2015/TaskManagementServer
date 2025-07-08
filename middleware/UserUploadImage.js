const multer = require("multer");

const storage = multer.memoryStorage();



// In your multer middleware (UserUploadImage.js)
const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, 
    files: 1 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ✅ Add a middleware wrapper to log when multer runs
const wrappedUpload = (req, res, next) => {
  console.log(">>> Multer middleware hit");
  upload.single("profile_image")(req, res, function (err) {
    if (err) {
      console.error(">>> Multer error:", err);
      return res.status(400).send({ error: err.message });
    }

    if (req.file) {
      console.log(">>> Multer got file:", req.file.originalname);
      console.log(">>> Buffer size:", req.file.buffer?.length);
    } else {
      console.log(">>> No file received.");
    }

    next();
  });
};


module.exports = wrappedUpload;
