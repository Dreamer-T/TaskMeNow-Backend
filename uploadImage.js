const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();

// 设置 multer 存储选项 (将文件保存到内存中)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 创建 GCS 客户端
const gcs = new Storage();

// The ID of your GCS bucket
const bucketName = 'tmn_company_logo_images';  // 替换为你自己的存储桶名称

// POST 路由：用于上传图像
router.post('/uploadImage', upload.single('file'), async (req, res) => {
    // 检查是否有文件上传
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const file = req.file;  // 获取上传的文件
    const destFileName = file.originalname;  // 使用原始文件名作为目标文件名

    try {
        // 将文件上传到 Google Cloud Storage
        await gcs.bucket(bucketName).file(destFileName).save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
            },
        });

        // 返回成功响应
        res.status(200).json({ message: `File uploaded successfully to ${bucketName}/${destFileName}` });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file to Cloud Storage' });
    }
});

module.exports = router;
