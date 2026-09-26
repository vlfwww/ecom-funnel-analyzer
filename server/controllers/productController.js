const pool = require("../config/db");

const getProducts = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    console.error("Product list request failed:", err);
    res.status(500).json({
      success: false,
      message: "Не удалось загрузить список товаров",
    });
  }
};

const validateProduct = (body) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const imageUrl =
    typeof body.image_url === "string" ? body.image_url.trim() : "";
  const price =
    typeof body.price === "number"
      ? body.price
      : typeof body.price === "string" && body.price.trim()
        ? Number(body.price)
        : Number.NaN;

  if (
    !name ||
    name.length > 200 ||
    !category ||
    category.length > 100 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !imageUrl ||
    imageUrl.length > 2048
  ) {
    return null;
  }

  return { name, category, price, imageUrl };
};

const createProduct = async (req, res) => {
  const product = validateProduct(req.body ?? {});
  if (!product) {
    return res.status(400).json({
      success: false,
      message: "Проверьте название, категорию, цену и ссылку на изображение",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, price, image_url, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [product.name, product.price, product.imageUrl, product.category],
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Product creation failed:", err);
    return res.status(500).json({
      success: false,
      message: "Не удалось создать товар",
    });
  }
};

const updateProduct = async (req, res) => {
  const productId = req.params.id;
  const product = validateProduct(req.body ?? {});
  if (!/^\d+$/.test(productId) || !product || Number(productId) < 1) {
    return res.status(400).json({
      success: false,
      message: "Проверьте идентификатор и данные товара",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, image_url = $3, category = $4
       WHERE id = $5
       RETURNING *`,
      [
        product.name,
        product.price,
        product.imageUrl,
        product.category,
        productId,
      ],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Товар не найден",
      });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Product update failed:", err);
    return res.status(500).json({
      success: false,
      message: "Не удалось сохранить товар",
    });
  }
};

const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  if (!/^\d+$/.test(productId) || Number(productId) < 1) {
    return res.status(400).json({
      success: false,
      message: "Некорректный идентификатор товара",
    });
  }

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [
      productId,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Товар не найден",
      });
    }
    return res.status(204).end();
  } catch (err) {
    console.error("Product deletion failed:", err);
    return res.status(500).json({
      success: false,
      message: "Не удалось удалить товар",
    });
  }
};

module.exports = { createProduct, deleteProduct, getProducts, updateProduct };
