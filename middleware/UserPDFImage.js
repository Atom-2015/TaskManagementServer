// middleware/documentUpload.js
const multer = require("multer");

const docStorage = multer.memoryStorage();

const allowedDocs = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedDocs.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only documents (PDF, DOC, DOCX) are allowed!"), false);
    }
  }
});

const wrappedDocUpload = (req, res, next) => {
  docUpload.single("document")(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });

    next();
  });
};

module.exports = wrappedDocUpload;
