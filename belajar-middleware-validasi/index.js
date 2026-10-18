import express from "express";
import logger from "./middleware/logger.js";
import booksRouter from "./routes/books.js";
import authorsRouter from "./routes/authors.js";

const app = express();

app.use(express.json());
app.use(logger);

app.use("/books", booksRouter);
app.use("/authors", authorsRouter);

app.get("/", (req, res) => {
  res.json({
    message: "API belajar middleware dan validasi berhasil"
  });
});

app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});