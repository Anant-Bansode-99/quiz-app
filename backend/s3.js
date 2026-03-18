const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if real AWS credentials are configured
const hasAwsCredentials = (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_ACCESS_KEY_ID !== 'your_access_key_here' &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'your_secret_key_here' &&
    process.env.S3_BUCKET_NAME
);

let upload;
let s3 = null;

if (hasAwsCredentials) {
    // --- AWS S3 storage ---
    const { S3Client } = require('@aws-sdk/client-s3');
    const multerS3 = require('multer-s3');

    s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    upload = multer({
        storage: multerS3({
            s3,
            bucket: process.env.S3_BUCKET_NAME,
            metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
            key: (req, file, cb) => {
                const fileName = `quiz-images/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
                cb(null, fileName);
            },
            contentType: multerS3.AUTO_CONTENT_TYPE,
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        },
    });

    console.log('[S3] Using AWS S3 for image uploads.');
} else {
    // --- Local disk storage fallback ---
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    upload = multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => cb(null, uploadDir),
            filename: (req, file, cb) => {
                const ext = path.extname(file.originalname);
                cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        },
    });

    console.log('[S3] AWS credentials not set — using local disk storage for image uploads.');
}

module.exports = { s3, upload, hasAwsCredentials };
