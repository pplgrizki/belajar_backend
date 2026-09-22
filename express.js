const express = require("express");

const app = express();
const port = 3000;

// Data diri
const me = [
  {
    nama: "M. Ricki Febriana",
    kelas: "12 PPLG",
    sekolah: "SMK Guna Cipta"
  }
];

const books = [
  {
    id: 1,
    judul: "Belajar JavaScript",
    penulis: "Andi"
  },
  {
    id: 2,
    judul: "Belajar ExpressJS",
    penulis: "Budi"
  }
];

app.get("/me", (req, res) => {
  res.json(me);
});

app.get("/books", (req, res) => {
  res.json(books);
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});