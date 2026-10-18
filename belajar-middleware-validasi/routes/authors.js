import express from "express";
import validateAuthor from "../validators/authorValidator.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    {
      name: "Ricki",
      slug: "ricki"
    },
    {
      name: "Miku",
      slug: "miku"
    }
  ]);
});

router.get("/:slug", (req, res) => {
  const { slug } = req.params;

  res.json({
    message: "Detail author",
    slug: slug
  });
});

router.post("/", validateAuthor, (req, res) => {
  res.status(201).json({
    message: "Author berhasil ditambahkan",
    data: req.body
  });
});

export default router;