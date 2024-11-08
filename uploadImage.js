const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage, limits: {
        fileSize: 1 * 1024 * 1024  // 1MB
    }
});

// GCS client
const gcs = new Storage();

// The ID of GCS bucket
const bucketName = 'tmn_company_logo_images';

// API for user to upload avatar
router.post('/uploadAvatar', upload.single('Avatar'), async (req, res) => {
    // if file is included
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const file = req.file;  // get uploaded file
    const destFileName = "UserAvatar/" + Date.now() + '-' + Math.round(Math.random() * 1E9) + file.originalname;  // unique file name

    try {
        // upload file to Google Cloud Storage
        await gcs.bucket(bucketName).file(destFileName).save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
            },
        });

        res.status(200).json({ message: `File uploaded successfully to ${bucketName}/${destFileName}` });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: 'Failed to upload file to Cloud Storage' });
    }
});

// API for user to upload avatar
router.post('/uploadTaskImage', upload.single('TaskImage'), async (req, res) => {
    // if file is included
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const file = req.file;  // get uploaded file
    const destFileName = "TaskImage/" + Date.now() + '-' + Math.round(Math.random() * 1E9) + file.originalname;  // unique file name

    try {
        // upload file to Google Cloud Storage
        await gcs.bucket(bucketName).file(destFileName).save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
            },
        });

        res.status(200).json({ message: `File uploaded successfully to ${bucketName}/${destFileName}` });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: 'Failed to upload file to Cloud Storage' });
    }
});

module.exports = router;
