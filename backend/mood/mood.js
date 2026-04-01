const express = require("express");
const pool = require("../database/DB");
const authenticate = require("../auth/auth-middleware");
const { decrypt } = require("../utils/encryption");

const router = express.Router();

// GET /mood - Returns emotion counts for the logged-in user (based on last 100 messages)
router.get("/", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get recent 100 entries and decrypt in JS
        const [rows] = await pool.query(`
            SELECT emotion, iv
            FROM mood_analysis
            WHERE user_id = ?
            ORDER BY analyzed_at DESC
            LIMIT 100
        `, [userId]);

        // Build a full map with all 7 emotions defaulting to 0
        const emotions = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise'];
        const result = {};
        emotions.forEach(e => result[e] = 0);
        
        rows.forEach(r => {
            const decEmotion = decrypt(r.emotion, r.iv);
            if (result[decEmotion] !== undefined) {
                result[decEmotion]++;
            }
        });

        res.json(result);
    } catch (err) {
        console.error("[Mood API] Error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /mood/history - Returns daily emotion counts for the last 7 days (for the overview line chart)
router.get("/history", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [rows] = await pool.query(`
            SELECT analyzed_at AS day, emotion, iv
            FROM mood_analysis
            WHERE user_id = ? AND analyzed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            ORDER BY analyzed_at ASC
        `, [userId]);

        const emotions = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Helper to get local YYYY-MM-DD string
        const getLocalDateString = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Build a map for each of the last 7 days ending today
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = getLocalDateString(d); // YYYY-MM-DD in local time
            const entry = { date: dayNames[d.getDay()] };
            emotions.forEach(e => entry[e] = 0);
            result.push({ _key: dateStr, ...entry });
        }

        // Fill in actual counts
        rows.forEach(r => {
            const key = getLocalDateString(new Date(r.day));
            const dayEntry = result.find(d => d._key === key);
            if (dayEntry) {
                const decEmotion = decrypt(r.emotion, r.iv);
                if (dayEntry[decEmotion] !== undefined) {
                    dayEntry[decEmotion]++;
                }
            }
        });

        // Remove internal _key before sending
        res.json(result.map(({ _key, ...rest }) => rest));
    } catch (err) {
        console.error("[Mood History API] Error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
