/**
 * Notes / Session Transcription Route
 * Proxies file uploads to the Flask note-taking service running on port 5000.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

const FLASK_URL = 'http://localhost:5000';

// Store uploads temporarily in a local 'uploads_tmp' dir
const tmpDir = path.join(__dirname, 'uploads_tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tmpDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${file.originalname}`;
        cb(null, unique);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'flac', 'mp4', 'mov', 'avi', 'mkv', 'webm'];
        const ext = file.originalname.split('.').pop().toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error(`File type not supported. Allowed: ${allowed.join(', ')}`));
    }
});

/**
 * POST /notes/transcribe
 * Body: multipart/form-data  { file: <audio/video>, email: <string> }
 */
router.post('/transcribe', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
    }

    const email = req.body.email;
    if (!email) {
        fs.unlink(req.file.path, () => { });
        return res.status(400).json({ error: 'Email address required' });
    }

    try {
        // Build a form-data payload to forward to Flask
        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
        form.append('email', email);

        const flaskRes = await axios.post(`${FLASK_URL}/api/transcribe`, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30 * 60 * 1000, // 30-minute timeout for long recordings
        });

        res.status(flaskRes.status).json(flaskRes.data);
    } catch (err) {
        const isConnRefused = err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || !err.response;
        const errorMessage = isConnRefused
            ? 'Transcription service is unavailable. Please try again in a moment.'
            : (err.response?.data?.error || err.message || 'Unknown error');

        console.error('Flask proxy error:', err.code || err.message);
        const status = err.response?.status || 503;
        res.status(status).json({ error: errorMessage });
    } finally {
        // Clean up temp file
        if (req.file?.path) {
            fs.unlink(req.file.path, () => { });
        }
    }
});

/**
 * GET /notes/health  — check if Flask service is reachable
 */
router.get('/health', async (req, res) => {
    try {
        const flaskRes = await axios.get(`${FLASK_URL}/health`, { timeout: 3000 });
        res.json({ node: 'ok', flask: flaskRes.data });
    } catch {
        res.status(503).json({ node: 'ok', flask: 'unavailable' });
    }
});

module.exports = router;
