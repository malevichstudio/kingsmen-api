const aws = require('aws-sdk');
const {AWS} = require('../config/constants');
const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
  secretAccessKey: AWS.secretAccessKey,
  accessKeyId: AWS.accessKeyId,
  region: AWS.region,
});

const s3 = new aws.S3({apiVersion: AWS.apiVersion});

const uploadFile = (bucket) => multer({
  fileFilter: (req, mimetype, cd) => {
    const supportedFormats = [
      //image formats:
      'image/jpeg', 'image/bmp', 'image/gif', 'image/png',
      //video formats:
      'video/mpeg',
      //-avi
      'video/x-msvideo',
      //-wmv
      'video/x-ms-wmv',
      //-3gp
      'video/3gpp',
      //-mkv
      'video/x-matroska',
      //-mov
      'video/quicktime'];
    return cd (
      supportedFormats.indexOf(mimetype.mimetype) === -1 ? new Error('This format is not supported') : null,
      supportedFormats.indexOf(mimetype.mimetype) !== -1);
  },
  storage: multerS3({
    s3,
    bucket: AWS.buckets[bucket],
    acl:'public-read-write',
    metadata: (req, file, cd) => {
      cd(null, {fieldName: file.fieldname});
    },
    key: (req, file, cd) => {
      cd (null, `${file.fieldname}_${Date.now().toString()}`);
    }
  })
}).any();

const removeFile = async (bucket, url) => (
  new Promise((resolve, reject) => {
    try {
      const uploadParams = {
        Bucket: AWS.buckets[bucket],
        Key: path.basename(url),
      };

      // call S3 to retrieve upload file to specified bucket
      s3.deleteObject(uploadParams, (err, data) => {
        if (err) {
          reject(err);
        } if (data) {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  })
);

module.exports = {uploadFile, removeFile};
