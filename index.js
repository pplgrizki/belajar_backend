const express = require("express");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SECRET_KEY = "rahasia123";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Halaman Login
app.get("/login", (req, res) => {
  res.send(`
    <h2>Login</h2>
    <form method="POST" action="/login">
      <input name="username" placeholder="Username">
      <input name="password" placeholder="Password" type="password">
      <button type="submit">Login</button>
    </form>
  `);
});

// Proses Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Cek user dari database
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !user) {
    return res.status(401).json({
      message: "Username atau password salah"
    });
  }

  // Kalau user benar, buat JWT
  const token = jwt.sign(
    { username: user.username },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.json({
    message: "Login berhasil",
    token: token
  });
});

// API /me
app.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Token tidak ditemukan"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    res.json({
      message: "Akses berhasil",
      user: decoded
    });
  } catch (error) {
    res.status(401).json({
      message: "Token tidak valid"
    });
  }
});

app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});