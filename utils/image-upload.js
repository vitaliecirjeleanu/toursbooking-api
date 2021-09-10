const multer = require('multer');
const uuid = require('uuid');

const MIME_TYPE_LIST = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

const imageUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let exactPath = 'tours';
      if (req.originalUrl.includes('users')) exactPath = 'users';

      cb(null, `uploads/images/${exactPath}`);
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_LIST[file.mimetype];
      cb(null, `${uuid.v1()}.${ext}`);
    },
    fileFilter: (req, file, cb) => {
      const isValid = !!MIME_TYPE_MAP[file.mimetype];
      let error = isValid ? null : new Error('Invalid mime type.');
      cb(error, isValid);
    },
  }),
});

module.exports = imageUpload;
