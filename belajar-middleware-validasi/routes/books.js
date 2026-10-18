import express from "express";
import validateBook from "../validators/bookValidator.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    {
      title: "Belajar JavaScript",
      slug: "belajar-javascript"
    },
    {
      title: "Belajar Express",
      slug: "belajar-express"
    }
  ]);
});

router.get("/:slug", (req, res) => {
  const { slug } = req.params;

  res.json({
    message: "Detail buku",
    slug: slug
  });
});

router.post("/", validateBook, (req, res) => {
  res.status(201).json({
    message: "Buku berhasil ditambahkan",
    data: req.body
  });
});

export default router;