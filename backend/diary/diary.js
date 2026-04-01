const express = require("express");
const router = express.Router();
const pool = require("../database/DB");
const authenticate = require("../auth/auth-middleware");
const { encrypt, decrypt } = require("../utils/encryption");

// GET /diary — fetch all diary entries for the logged-in user (newest first)
router.get("/", authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, title, content, created_at, updated_at, iv FROM diary_entries WHERE user_id = ? ORDER BY created_at DESC",
            [req.user.userId]
        );
        
        const decryptedRows = rows.map(r => {
            let titleIv, contentIv;
            try {
                if (r.iv) {
                    const parsed = JSON.parse(r.iv);
                    titleIv = parsed.titleIv;
                    contentIv = parsed.contentIv;
                }
            } catch (e) {
                // Ignore parse errors (fallback for old unencrypted data)
            }
            return {
                ...r,
                title: decrypt(r.title, titleIv || r.iv), // r.iv as fallback if JSON parse failed but it's a string
                content: decrypt(r.content, contentIv || r.iv),
                iv: undefined
            };
        });

        res.json(decryptedRows);
    } catch (err) {
        console.error("Diary fetch error:", err.message);
        res.status(500).json({ error: "Could not fetch diary entries" });
    }
});

// POST /diary — create a new diary entry
router.post("/", authenticate, async (req, res) => {
    const { title, content } = req.body;
    if (!content) {
        return res.status(400).json({ error: "Content is required" });
    }

    try {
        const { iv: titleIv, encryptedData: encTitle } = encrypt(title || "Untitled");
        const { iv: contentIv, encryptedData: encContent } = encrypt(content);
        const combinedIv = JSON.stringify({ titleIv, contentIv });

        const [result] = await pool.query(
            "INSERT INTO diary_entries (user_id, title, content, iv) VALUES (?, ?, ?, ?)",
            [req.user.userId, encTitle, encContent, combinedIv]
        );
        
        // Return decrypted format immediately so frontend has plain data
        res.status(201).json({
            id: result.insertId,
            title: title || "Untitled",
            content: content,
            created_at: new Date().toISOString(),
            updated_at: null
        });
    } catch (err) {
        console.error("Diary create error:", err.message);
        res.status(500).json({ error: "Could not create diary entry" });
    }
});

// DELETE /diary/:id — delete a diary entry (owner-only)
router.delete("/:id", authenticate, async (req, res) => {
    try {
        const [result] = await pool.query(
            "DELETE FROM diary_entries WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Entry not found or not yours" });
        }
        res.json({ message: "Entry deleted" });
    } catch (err) {
        console.error("Diary delete error:", err.message);
        res.status(500).json({ error: "Could not delete diary entry" });
    }
});

module.exports = router;
