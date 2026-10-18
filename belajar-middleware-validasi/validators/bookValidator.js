const validateBook = (req, res, next) => {
  const { title, slug } = req.body;

  if (!title || !slug) {
    return res.status(400).json({
      error: "title dan slug wajib diisi"
    });
  }

  next();
};

export default validateBook;