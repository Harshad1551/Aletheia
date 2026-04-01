const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Store uploaded files in memory
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
});

// POST /upload/profile-picture
// Returns: { url: "data:image/jpeg;base64,..." }
router.post('/profile-picture', upload.single('profile_picture'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Convert buffer to base64
    const base64Data = req.file.buffer.toString('base64');
    const url = `data:${req.file.mimetype};base64,${base64Data}`;

    res.json({ url });
});

module.exports = router;
