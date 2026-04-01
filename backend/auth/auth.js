const bcrypt = require('bcryptjs');
const { genrateToken } = require("./JWT")
const pool = require('../database/DB')
const express = require("express")
const router = express.Router();
const authenticate = require("../auth/auth-middleware")

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role, profile_picture, latitude, longitude, contact_number } = req.body;
        const address = role === "therapist" ? (req.body.address || null) : null;
        if ((!email && !contact_number) || !password || !name || !role) {
            return res.status(400).json({ message: "name, Email, password and role are required" })
        }
        if (!["client", "therapist"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role selected",
            });
        }
        const [existing] = await pool.query(
            "SELECT user_id FROM signup WHERE email = ? OR contact_number = ?",
            [email || null, contact_number || null]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: "User already exist" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            "INSERT INTO signup(email, password, role, name, profile_picture, address, latitude, longitude, contact_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
            [email, hashedPassword, role, name, profile_picture, address, latitude, longitude, contact_number]
        );

        const token = genrateToken({
            userId: result.insertId,
            role,
            name
        });

        res.status(201).json({
            message: "Signup Succesful",
            token,
            user: {
                id: result.insertId,
                email,
                contact_number,
                name,
                role,
            },
        });


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
})
// router.get("/client-resource", authenticate, async (req, res) => {
//   // 🔐 Role check at backend (your chosen design)
//   if (req.user.role !== "client") {
//     return res.status(403).json({
//       message: "You are not authorized to access client resources",
//     });
//   }

//   try {
//     // Dummy response (replace with DB query later)
//     res.status(200).json({
//       message: "Client resource access verified ✅",
//       user: {
//         userId: req.user.userId,
//         role: req.user.role,
//       },
//       data: {
//         info: "This is a protected client-only resource",
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

router.post("/login", async (req, res) => {
    try {
        const { email, contact_number, password } = req.body;
        // The frontend currently sends the input value in BOTH 'email' and 'contact_number'.
        const identifier = email || contact_number;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Email/Number and password are required" })
        }

        const [rows] = await pool.query(
            "SELECT user_id, password, role, name FROM signup WHERE email = ? OR contact_number = ?",
            [identifier, identifier]
        )

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password" })
        }
        const token = genrateToken({
            userId: user.user_id,
            role: user.role,
            name: user.name,
        });

        await pool.query(
            "INSERT INTO login_history(user_id, email, login_time) VALUES (?, ?, NOW())",
            [user.user_id, email]
        )

        res.json({
            token,
            user: {
                id: user.user_id,
                role: user.role,
                name: user.name,
            }
        })

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
})
router.get("/profile", authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT name, email, role, profile_picture, latitude, longitude, address, contact_number, created_at FROM signup WHERE user_id = ?",
            [req.user.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = rows[0];
        res.json({
            name: user.name,
            email: user.email,
            contact_number: user.contact_number,
            role: user.role,
            profilePicture: user.profile_picture || null,
            latitude: user.latitude || null,
            longitude: user.longitude || null,
            address: user.role === 'therapist' ? (user.address || null) : undefined,
            joinedAt: user.created_at
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router

