const express = require("express");
const router = express.Router();
const pool = require("../database/DB");
const authenticate = require("../auth/auth-middleware");
const { decrypt } = require("../utils/encryption");

// Get chat history with a specific user
router.get("/history/:otherUserId", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const otherUserId = req.params.otherUserId;

        const [rows] = await pool.query(
            `SELECT id, sender_id, receiver_id, message, created_at, iv 
             FROM chats 
             WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?)
             ORDER BY created_at ASC`,
            [userId, otherUserId, otherUserId, userId]
        );

        // Decrypt messages
        const decryptedRows = rows.map(r => ({
            ...r,
            message: decrypt(r.message, r.iv),
            iv: undefined // Keep IV private
        }));

        res.json(decryptedRows);
    } catch (err) {
        console.error("Error fetching chat history:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get a list of users this person has chatted with recently
router.get("/contacts", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find all distinct users the current user has exchanged messages with
        const [rows] = await pool.query(
            `SELECT DISTINCT
                CASE 
                    WHEN sender_id = ? THEN receiver_id 
                    ELSE sender_id 
                END as contact_id
             FROM chats
             WHERE sender_id = ? OR receiver_id = ?`,
            [userId, userId, userId]
        );

        if (rows.length === 0) {
            return res.json([]);
        }

        const contactIds = rows.map(r => r.contact_id);

        // Fetch user details for these contacts
        const [users] = await pool.query(
            `SELECT user_id, name, role, profile_picture 
             FROM signup 
             WHERE user_id IN (?)`,
            [contactIds]
        );

        // Map them nicely
        const contacts = users.map(u => ({
            id: u.user_id,
            name: u.name,
            role: u.role,
            profilePicture: u.profile_picture ? (u.profile_picture.startsWith('data:') ? u.profile_picture : `http://localhost:3000/uploads/${u.profile_picture.split('/').pop()}`) : null
        }));

        res.json(contacts);
    } catch (err) {
        console.error("Error fetching chat contacts:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
