package main

import (
	"app-scan-barcode/model"
	"app-scan-barcode/utils"
	"database/sql"
	"log"

	"github.com/gofiber/fiber/v2"
	_ "modernc.org/sqlite"
)

var db *sql.DB

func main() {
	var err error
	db, err = sql.Open("sqlite", "products.db")
	if err != nil {
		log.Fatal(err)
	}

	// Buat tabel products
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS products (
		id_product INTEGER PRIMARY KEY AUTOINCREMENT,
		product_code TEXT,
		product_name TEXT,
		colour TEXT,
		size TEXT,
		stock INTEGER,
		price REAL,
		capital_price REAL,
		is_active INTEGER DEFAULT 1,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP,
		updated_at TEXT DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Fatal(err)
	}

	// Buat tabel transactions
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS transactions (
		id_transaction INTEGER PRIMARY KEY AUTOINCREMENT,
		id_product INTEGER,
		product_code TEXT,
		product_name TEXT,
		colour TEXT,
		size TEXT,
		stock INTEGER,
		discount REAL,
		admin_fee REAL,
		remark TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(id_product) REFERENCES products(id_product)
	)`)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS account (
		id_account INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT,
		password TEXT,
		role TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(id_account) REFERENCES products(id_account)
	)`)
	if err != nil {
		log.Fatal(err)
	}

	app := fiber.New()

	// CRUD Products
	app.Post("/products", addProduct)
	app.Get("/products", listProducts)
	app.Post("/product/:id", editProduct)

	// CRUD Transactions
	app.Post("/transactions", addTransaction)
	app.Get("/transactions", listTransactions)

	// QR Code
	app.Get("/qrcode/:id", generateQR)

	log.Fatal(app.Listen(":3000"))
}

func addProduct(c *fiber.Ctx) error {
	product := new(model.Product)
	if err := c.BodyParser(product); err != nil {
		return c.Status(400).SendString(err.Error())
	}

	_, err := db.Exec(`
		INSERT INTO products (product_code, product_name, colour, size, stock, price, capital_price)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		product.ProductCode, product.ProductName, product.Colour,
		product.Size, product.Stock, product.Price, product.CapitalPrice)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	return c.JSON(fiber.Map{"message": "product added"})
}

func editProduct(c *fiber.Ctx) error {
	id := c.Params("id")

	product := new(model.Product)
	if err := c.BodyParser(product); err != nil {
		return c.Status(400).SendString(err.Error())
	}

	_, err := db.Exec(`
		UPDATE products SET product_code=?, product_name=?, colour=?, size=?, stock=?, price=?, capital_price=?
		WHERE id_product = ?`,
		product.ProductCode, product.ProductName, product.Colour,
		product.Size, product.Stock, product.Price, product.CapitalPrice, id)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	return c.JSON(fiber.Map{"message": "product added"})
}

func listProducts(c *fiber.Ctx) error {
	rows, err := db.Query("SELECT id_product, product_code, product_name, colour, size, stock, price, capital_price, is_active, created_at, updated_at FROM products where is_active = 1")
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var it model.Product
		if err := rows.Scan(&it.IDProduct, &it.ProductCode, &it.ProductName, &it.Colour, &it.Size,
			&it.Stock, &it.Price, &it.CapitalPrice, &it.IsActive, &it.CreatedAt, &it.UpdatedAt); err != nil {
			return err
		}
		products = append(products, it)
	}
	return c.JSON(products)
}

func addTransaction(c *fiber.Ctx) error {
	trx := new(model.Transaction)
	if err := c.BodyParser(trx); err != nil {
		return c.Status(400).SendString(err.Error())
	}

	// Insert transaksi
	_, err := db.Exec(`
		INSERT INTO transactions (id_product, product_code, product_name, colour, size, stock, discount, price, admin_fee, remark)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		trx.IDProduct, trx.ProductCode, trx.ProductName, trx.Colour,
		trx.Size, trx.Stock, trx.Discount, trx.AdminFee, trx.Remark)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}

	// Update stock produk
	_, err = db.Exec("UPDATE products SET stock = stock - ? WHERE id_product = ?", trx.Stock, trx.IDProduct)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}

	return c.JSON(fiber.Map{"message": "transaction added & stock updated"})
}

func listTransactions(c *fiber.Ctx) error {
	rows, err := db.Query("SELECT id_transaction, id_product, product_code, product_name, colour, size, stock, discount, admin_fee, remark, created_at FROM transactions")
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	defer rows.Close()

	var trxs []model.Transaction
	for rows.Next() {
		var it model.Transaction
		if err := rows.Scan(&it.IDTransaction, &it.IDProduct, &it.ProductCode, &it.ProductName,
			&it.Colour, &it.Size, &it.Stock, &it.Discount, &it.AdminFee, &it.Remark, &it.CreatedAt); err != nil {
			return err
		}
		trxs = append(trxs, it)
	}
	return c.JSON(trxs)
}

func generateQR(c *fiber.Ctx) error {
	id := c.Params("id")

	var products model.Product

	err := db.QueryRow("SELECT id_product, product_code, product_name, colour, size, stock, price, capital_price, is_active, created_at, updated_at FROM products where is_active = 1 and id_product = ?", id).Scan(&products.IDProduct, &products.ProductCode, &products.ProductName, &products.Colour, &products.Size, &products.Stock, &products.Price, &products.CapitalPrice, &products.IsActive, &products.CreatedAt, &products.UpdatedAt)

	if err != nil {
		return c.Status(500).SendString(err.Error())
	}

	utils.GenerateQR(c, products)

	return nil
}
