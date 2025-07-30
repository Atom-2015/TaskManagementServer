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







// const multer = require("multer");

// const storage = multer.memoryStorage();

// // Allowed MIME types: images + pdf + doc + docx
// const allowedTypes = [
//   'image/jpeg',
//   'image/png',
//   'image/jpg',
//   'application/pdf',
//   'application/msword', // .doc
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
// ];

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // max 10 MB
//     files: 1
//   },
//   fileFilter: (req, file, cb) => {
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only images (jpg, png) or documents (pdf, doc, docx) are allowed!'), false);
//     }
//   }
// });

// const wrappedUpload = (req, res, next) => {
//   console.log(">>> Multer middleware hit");

//   // can change field name: 'file' is generic for both
//   upload.single("file")(req, res, function (err) {
//     if (err) {
//       console.error(">>> Multer error:", err);
//       return res.status(400).send({ error: err.message });
//     }

//     if (req.file) {
//       console.log(">>> Multer got file:", req.file.originalname);
//       console.log(">>> MIME type:", req.file.mimetype);
//       console.log(">>> Buffer size:", req.file.buffer?.length);
//     } else {
//       console.log(">>> No file received.");
//     }

//     next();
//   });
// };

// module.exports = wrappedUpload;
