const express = require('express');
const router = express.Router();
const pool = require('../database/DB');
const authenticate = require('../auth/auth-middleware');

// GET /therapists/stats — returns aggregate stats for the authenticated therapist
router.get('/stats', authenticate, async (req, res) => {
    try {
        const therapistId = req.user.userId;

        // Active = accepted, no sessions set at all yet
        const [[activeRow]] = await pool.query(
            `SELECT COUNT(*) as count FROM appointment_requests
             WHERE therapist_id = ? AND status = 'accepted'
               AND next_session IS NULL AND last_session IS NULL`,
            [therapistId]
        );

        // Upcoming = accepted, next_session is in the future
        const [[upcomingRow]] = await pool.query(
            `SELECT COUNT(*) as count FROM appointment_requests
             WHERE therapist_id = ? AND status = 'accepted' AND next_session IS NOT NULL AND next_session > NOW()`,
            [therapistId]
        );

        // Recent = accepted, has a last_session (stays in recent even with next_session set)
        const [[recentRow]] = await pool.query(
            `SELECT COUNT(*) as count FROM appointment_requests
             WHERE therapist_id = ? AND status = 'accepted'
               AND last_session IS NOT NULL`,
            [therapistId]
        );

        // Pending requests
        const [[pendingRow]] = await pool.query(
            `SELECT COUNT(*) as count FROM appointment_requests WHERE therapist_id = ? AND status = 'pending'`,
            [therapistId]
        );

        res.json({
            activeClients: activeRow.count,
            upcomingSessions: upcomingRow.count,
            recentClients: recentRow.count,
            pendingRequests: pendingRow.count
        });
    } catch (err) {
        console.error("Error fetching therapist stats:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /therapists/clients — returns categorized clients for the authenticated therapist
router.get('/clients', authenticate, async (req, res) => {
    try {
        const therapistId = req.user.userId;

        const mapClient = (r) => ({
            id: r.client_id,
            name: r.name,
            profilePicture: r.profile_picture ? (r.profile_picture.startsWith('data:') ? r.profile_picture : `http://localhost:3000/uploads/${r.profile_picture.split('/').pop()}`) : null,
            nextSession: r.next_session || null,
            lastSession: r.last_session || null,
            firstSessionDate: r.first_session_date || null,
            sessionNotes: r.session_notes || null,
            acceptedAt: r.created_at
        });

        // Active: accepted, no sessions ever set
        const [activeRows] = await pool.query(
            `SELECT r.client_id, u.name, u.profile_picture, r.next_session, r.last_session,
                    r.first_session_date, r.session_notes, r.created_at
             FROM appointment_requests r
             JOIN signup u ON u.user_id = r.client_id
             WHERE r.therapist_id = ? AND r.status = 'accepted'
               AND r.next_session IS NULL AND r.last_session IS NULL
             ORDER BY r.created_at DESC`,
            [therapistId]
        );

        // Upcoming: accepted, next_session is in the future
        const [upcomingRows] = await pool.query(
            `SELECT r.client_id, u.name, u.profile_picture, r.next_session, r.last_session,
                    r.first_session_date, r.session_notes, r.created_at
             FROM appointment_requests r
             JOIN signup u ON u.user_id = r.client_id
             WHERE r.therapist_id = ? AND r.status = 'accepted'
               AND r.next_session IS NOT NULL AND r.next_session > NOW()
             ORDER BY r.next_session ASC`,
            [therapistId]
        );

        // Recent: accepted, has last_session (stays here even when next_session is set)
        const [recentRows] = await pool.query(
            `SELECT r.client_id, u.name, u.profile_picture, r.next_session, r.last_session,
                    r.first_session_date, r.session_notes, r.created_at
             FROM appointment_requests r
             JOIN signup u ON u.user_id = r.client_id
             WHERE r.therapist_id = ? AND r.status = 'accepted'
               AND r.last_session IS NOT NULL
             ORDER BY r.last_session DESC`,
            [therapistId]
        );

        res.json({
            active: activeRows.map(mapClient),
            upcoming: upcomingRows.map(mapClient),
            recent: recentRows.map(mapClient)
        });
    } catch (err) {
        console.error("Error fetching therapist clients:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /therapists/client/:clientId/session — therapist updates next/last session for a client
router.put('/client/:clientId/session', authenticate, async (req, res) => {
    try {
        const therapistId = req.user.userId;
        const clientId = req.params.clientId;
        const { nextSession, lastSession } = req.body;

        // Convert ISO string to MySQL DATETIME format
        const toMySQL = (val) => {
            if (!val) return null;
            const d = new Date(val);
            if (isNaN(d.getTime())) return null;
            return d.toISOString().slice(0, 19).replace('T', ' ');
        };

        // Build a dynamic SET clause
        const updates = [];
        const params = [];
        if (nextSession !== undefined) { updates.push('next_session = ?'); params.push(toMySQL(nextSession)); }
        if (lastSession !== undefined) { updates.push('last_session = ?'); params.push(toMySQL(lastSession)); }

        if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

        // Also set first_session_date if it hasn't been set yet (first time scheduling)
        const firstDate = toMySQL(nextSession) || toMySQL(lastSession);
        if (firstDate) {
            updates.push('first_session_date = COALESCE(first_session_date, ?)');
            params.push(firstDate);
        }

        params.push(therapistId, clientId);

        const [result] = await pool.query(
            `UPDATE appointment_requests SET ${updates.join(', ')} WHERE therapist_id = ? AND client_id = ? AND status = 'accepted'`,
            params
        );

        res.json({ message: 'Session updated successfully', updated: result.affectedRows > 0 });
    } catch (err) {
        console.error("Error updating session:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /therapists/client/:clientId/complete-session — mark a session as completed
router.put('/client/:clientId/complete-session', authenticate, async (req, res) => {
    try {
        const therapistId = req.user.userId;
        const clientId = req.params.clientId;
        const { sessionNotes } = req.body;

        // Move next_session → last_session, clear next_session
        const updates = ['last_session = next_session', 'next_session = NULL'];
        const params = [];
        if (sessionNotes !== undefined) {
            updates.push('session_notes = ?');
            params.push(sessionNotes);
        }
        params.push(therapistId, clientId);

        const [result] = await pool.query(
            `UPDATE appointment_requests SET ${updates.join(', ')} WHERE therapist_id = ? AND client_id = ? AND status = 'accepted' AND next_session IS NOT NULL`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No upcoming session found for this client' });
        }

        res.json({ message: 'Session marked as completed' });
    } catch (err) {
        console.error("Error completing session:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /therapists/requests/pending — returns all pending requests for the authenticated therapist
router.get('/requests/pending', authenticate, async (req, res) => {
    try {
        const therapistId = req.user.userId;
        const [rows] = await pool.query(
            `SELECT r.id as request_id, 
                    u.user_id as client_id, 
                    u.name as client_name, 
                    u.profile_picture, 
                    r.created_at
             FROM appointment_requests r
             JOIN signup u ON u.user_id = r.client_id
             WHERE r.therapist_id = ? AND r.status = 'pending'
             ORDER BY r.created_at DESC`,
            [therapistId]
        );

        const requests = rows.map(r => ({
            id: r.request_id,
            clientId: r.client_id,
            name: r.client_name,
            profilePicture: r.profile_picture ? (r.profile_picture.startsWith('data:') ? r.profile_picture : `http://localhost:3000/uploads/${r.profile_picture.split('/').pop()}`) : null,
            time: r.created_at,
            type: "Initial Consultation" // dummy type for UI
        }));

        res.json(requests);
    } catch (err) {
        console.error("Error fetching pending requests:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /therapists/request — client sends a connection request to a therapist
router.post('/request', authenticate, async (req, res) => {
    try {
        const clientId = req.user.userId;
        const { therapist_id } = req.body;

        if (!therapist_id) {
            return res.status(400).json({ message: "Therapist ID is required" });
        }

        // Check if an active relationship already exists (accepted or pending)
        const [[existing]] = await pool.query(
            `SELECT id, status, next_session, last_session FROM appointment_requests 
             WHERE client_id = ? AND therapist_id = ? AND status IN ('accepted', 'pending')
             LIMIT 1`,
            [clientId, therapist_id]
        );

        if (existing) {
            if (existing.status === 'pending') {
                return res.status(409).json({ message: "You already have a pending request with this therapist." });
            }
            // Status is 'accepted' — block if sessions are active
            return res.status(409).json({ message: "You are already connected with this therapist." });
        }

        // No active relationship — allow insert (or re-insert if previously declined)
        await pool.query(
            `INSERT INTO appointment_requests (client_id, therapist_id, status) 
             VALUES (?, ?, 'pending')
             ON DUPLICATE KEY UPDATE status = 'pending', next_session = NULL, last_session = NULL, first_session_date = NULL, session_notes = NULL`,
            [clientId, therapist_id]
        );

        res.json({ message: "Request sent successfully" });
    } catch (err) {
        console.error("Error sending request:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /therapists/request/:id/status — therapist accepts or declines a request
router.put('/request/:id/status', authenticate, async (req, res) => {
    try {
        const therapistId = req.user.userId;
        const requestId = req.params.id;
        const { status } = req.body; // 'accepted' or 'declined'

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const [result] = await pool.query(
            `UPDATE appointment_requests SET status = ? WHERE id = ? AND therapist_id = ?`,
            [status, requestId, therapistId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Request not found or unauthorized" });
        }

        res.json({ message: `Request ${status} successfully` });
    } catch (err) {
        console.error("Error updating request status:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /therapists — returns all therapists with location data (public, no auth required)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT user_id, name, email, profile_picture, latitude, longitude, address, contact_number, created_at
             FROM signup
             WHERE role = 'therapist'
               AND latitude IS NOT NULL
               AND longitude IS NOT NULL`
        );
        const therapists = rows.map(t => ({
            id: t.user_id,
            name: t.name,
            email: t.email || null,
            profilePicture: t.profile_picture ? (t.profile_picture.startsWith('data:') ? t.profile_picture : `http://localhost:3000/uploads/${t.profile_picture.split('/').pop()}`) : null,
            latitude: parseFloat(t.latitude),
            longitude: parseFloat(t.longitude),
            address: t.address || null,
            contactNumber: t.contact_number || null,
            joinedAt: t.created_at || null
        }));
        res.json(therapists);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
