const multer = require("multer");

const uploadLogoMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB logo limit
});

module.exports = { uploadLogoMemory };
