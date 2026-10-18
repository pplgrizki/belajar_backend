const validateAuthor = (req, res, next) => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    return res.status(400).json({
      error: "name dan slug wajib diisi"
    });
  }

  next();
};

export default validateAuthor;