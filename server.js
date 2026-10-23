
require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("ERROR: SUPABASE_URL atau SUPABASE_KEY belum tersedia di .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token tidak ditemukan." });
    }

    const token = authHeader.slice(7).trim();

    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                message: "Token tidak valid atau kedaluwarsa."
            });
        }

        req.user = data.user;

        req.userSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        next();
    } catch (error) {
        console.error("Kesalahan verifikasi JWT:", error.message);
        return res.status(500).json({
            message: "Gagal memverifikasi token."
        });
    }
}

function sendError(res, error) {
    console.error("Supabase error:", error.message);

    return res.status(400).json({
        message: error.message || "Permintaan gagal."
    });
}

// Status server
app.get("/api/status", (req, res) => {
    res.json({ message: "Pixel Vault API berhasil berjalan!" });
});

// Log login
app.post("/api/login-log", (req, res) => {
    console.log("Login log diterima.");
    res.json({ message: "Log diterima." });
});

// Profil pengguna
app.get("/api/me", verifyToken, (req, res) => {
    res.json({
        message: "Token valid. Akses berhasil.",
        user: {
            id: req.user.id,
            email: req.user.email
        }
    });
});

// ==============================
// CRUD BOOKS
// Kolom: id, title, slug, user_id
// ==============================

app.get("/api/books", verifyToken, async (req, res) => {
    const { data, error } = await req.userSupabase
        .from("books")
        .select("id, title, slug")
        .eq("user_id", req.user.id)
        .order("id", { ascending: false });

    if (error) return sendError(res, error);

    res.json({ data: data || [] });
});

app.post("/api/books", verifyToken, async (req, res) => {
    const title = String(req.body.title || "").trim();
    const slug = String(req.body.slug || "").trim();

    if (!title || !slug) {
        return res.status(400).json({
            message: "Judul dan slug buku wajib diisi."
        });
    }

    const { data, error } = await req.userSupabase
        .from("books")
        .insert({
            title,
            slug,
            user_id: req.user.id
        })
        .select("id, title, slug")
        .single();

    if (error) return sendError(res, error);

    res.status(201).json({ data });
});

app.put("/api/books/:id", verifyToken, async (req, res) => {
    const title = String(req.body.title || "").trim();
    const slug = String(req.body.slug || "").trim();

    if (!title || !slug) {
        return res.status(400).json({
            message: "Judul dan slug buku wajib diisi."
        });
    }

    const { data, error } = await req.userSupabase
        .from("books")
        .update({ title, slug })
        .eq("id", req.params.id)
        .eq("user_id", req.user.id)
        .select("id, title, slug")
        .maybeSingle();

    if (error) return sendError(res, error);

    if (!data) {
        return res.status(404).json({
            message: "Buku tidak ditemukan."
        });
    }

    res.json({ data });
});

app.delete("/api/books/:id", verifyToken, async (req, res) => {
    const { data, error } = await req.userSupabase
        .from("books")
        .delete()
        .eq("id", req.params.id)
        .eq("user_id", req.user.id)
        .select("id")
        .maybeSingle();

    if (error) return sendError(res, error);

    if (!data) {
        return res.status(404).json({
            message: "Buku tidak ditemukan."
        });
    }

    res.json({ message: "Buku berhasil dihapus." });
});

// ==============================
// CRUD AUTHORS
// Kolom: id, name, user_id
// ==============================

app.get("/api/authors", verifyToken, async (req, res) => {
    const { data, error } = await req.userSupabase
        .from("authors")
        .select("id, name")
        .eq("user_id", req.user.id)
        .order("id", { ascending: false });

    if (error) return sendError(res, error);

    res.json({ data: data || [] });
});

app.post("/api/authors", verifyToken, async (req, res) => {
    const name = String(req.body.name || "").trim();

    if (!name) {
        return res.status(400).json({
            message: "Nama penulis wajib diisi."
        });
    }

    const { data, error } = await req.userSupabase
        .from("authors")
        .insert({
            name,
            user_id: req.user.id
        })
        .select("id, name")
        .single();

    if (error) return sendError(res, error);

    res.status(201).json({ data });
});

app.put("/api/authors/:id", verifyToken, async (req, res) => {
    const name = String(req.body.name || "").trim();

    if (!name) {
        return res.status(400).json({
            message: "Nama penulis wajib diisi."
        });
    }

    const { data, error } = await req.userSupabase
        .from("authors")
        .update({ name })
        .eq("id", req.params.id)
        .eq("user_id", req.user.id)
        .select("id, name")
        .maybeSingle();

    if (error) return sendError(res, error);

    if (!data) {
        return res.status(404).json({
            message: "Penulis tidak ditemukan."
        });
    }

    res.json({ data });
});

app.delete("/api/authors/:id", verifyToken, async (req, res) => {
    const { data, error } = await req.userSupabase
        .from("authors")
        .delete()
        .eq("id", req.params.id)
        .eq("user_id", req.user.id)
        .select("id")
        .maybeSingle();

    if (error) return sendError(res, error);

    if (!data) {
        return res.status(404).json({
            message: "Penulis tidak ditemukan."
        });
    }

    res.json({ message: "Penulis berhasil dihapus." });
});

// Sajikan frontend
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log("==================================");
    console.log("PIXEL VAULT API + FETCH CRUD AKTIF");
    console.log(`Server: http://localhost:${PORT}`);
    console.log("Books: GET, POST, PUT, DELETE /api/books");
    console.log("Authors: GET, POST, PUT, DELETE /api/authors");
    console.log("==================================");
});
