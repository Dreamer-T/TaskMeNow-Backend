const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { authorizeRole } = require('./authMiddleware');
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
router.post('/uploadAvatar', authorizeRole('Staff'), upload.single('Avatar'), async (req, res) => {
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
router.post('/uploadTaskImage', authorizeRole('Staff'), upload.single('TaskImage'), async (req, res) => {
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

//get image from cloud storage
router.get('/getImage', authorizeRole('Staff'), async (req, res) => {
    const { fileName } = req.query;  // 从查询参数获取 fileName

    if (!fileName) {
        return res.status(400).json({ error: 'fileName is required' });
    }

    const file = gcs.bucket(bucketName).file(fileName);  // 获取 GCS 中的文件

    try {
        // 检查文件是否存在
        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).json({ error: `File "${fileName}" not found in the bucket` });
        }

        // 创建文件读取流并将其管道输出到响应中
        file.createReadStream()
            .on('error', (err) => {
                console.error('Error downloading file:', err);
                res.status(500).json({ error: 'Error downloading file from GCS' });
            })
            .on('end', () => {
                console.log('File transfer complete');
            })
            .pipe(res);  // 将文件流直接传递给客户端
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ error: 'Failed to fetch file from GCS' });
    }
});


module.exports = router;
