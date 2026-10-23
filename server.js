require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = 3001;

app.use(express.json());

// Koneksi ke Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("ERROR: SUPABASE_URL atau SUPABASE_KEY belum tersedia di .env");
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Middleware untuk memverifikasi JWT Supabase
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Token tidak ditemukan."
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            message: "Token kosong."
        });
    }

    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                message: "Token tidak valid atau kedaluwarsa."
            });
        }

        req.user = data.user;
        next();
    } catch (error) {
        console.error("Kesalahan verifikasi JWT:", error.message);

        return res.status(500).json({
            message: "Terjadi kesalahan saat memverifikasi token."
        });
    }
}

// Cek apakah server aktif
app.get("/api/status", (req, res) => {
    res.json({
        message: "Pixel Vault API berhasil berjalan!"
    });
});

// Log informasi login untuk keperluan debugging
// Data dari endpoint ini bukan bukti autentikasi.
app.post("/api/login-log", (req, res) => {
    console.log("========== LOGIN PIXEL VAULT ==========");
    console.log("Email:", req.body.email);
    console.log("User ID:", req.body.userId);
    console.log("========================================");

    res.json({
        message: "Log diterima."
    });
});

// Endpoint profil: wajib membawa JWT yang valid
app.get("/api/me", verifyToken, (req, res) => {
    console.log("========== API ME ==========");
    console.log("Email:", req.user.email);
    console.log("User ID:", req.user.id);
    console.log("============================");

    res.json({
        message: "Token valid. Akses berhasil.",
        user: {
            id: req.user.id,
            email: req.user.email
        }
    });
});

// Sajikan halaman frontend
app.use(express.static(__dirname));

// Penanda agar kita tahu server.js yang baru sedang berjalan
app.listen(PORT, () => {
    console.log("==================================");
    console.log("PIXEL VAULT JWT BACKEND AKTIF");
    console.log(`Server: http://localhost:${PORT}`);
    console.log("Endpoint: GET /api/status");
    console.log("Endpoint: GET /api/me");
    console.log("==================================");
});