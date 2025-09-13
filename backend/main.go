package main

import (
	"app-scan-barcode/model"
	"app-scan-barcode/utils"
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	_ "modernc.org/sqlite"
)

var db *sql.DB

// Define a new struct for a standardized JSON response
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
        qty INTEGER,
        discount REAL,
        admin_fee REAL,		
        is_active INTEGER DEFAULT 1,
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

	_, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS size (
        id_size INTEGER PRIMARY KEY AUTOINCREMENT,
        size TEXT
    )`)
	if err != nil {
		log.Fatal(err)
	}

	app := fiber.New()
	app.Use(cors.New())

	// API Login
	app.Post("/login", login)

	// CRUD Products
	app.Post("/products", addProduct)
	app.Get("/products", listProducts) //products?page=1&limit=20
	app.Put("/product/:id", editProduct)
	app.Get("/product/:id", getProduct)
	app.Delete("/product/:id", deleteProduct)

	// CRUD Transactions
	app.Post("/transactions", addTransaction)
	app.Get("/transactions", listTransactions) //transactions?page=1&limit=20
	app.Put("/transaction/:id", editTransaction)
	app.Get("/transaction/:id", getTransaction)
	app.Delete("/transaction/:id", deleteTransaction)

	// List Size
	app.Get("/sizes", listSizes)

	// Static file untuk akses barcode
	app.Static("/", "./public")
	// QR Code
	app.Post("/print", generateQR)

	// log.Fatal(app.Listen(":3000"))

	log.Fatal(app.ListenTLS(":3000", "./cert/cert.pem", "./cert/key.pem"))
}

// Handler untuk login
func login(c *fiber.Ctx) error {
	type LoginRequest struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: "Invalid request",
			Data:    nil,
		})
	}

	var idAccount int
	var username, role string
	err := db.QueryRow("SELECT id_account, username, role FROM account WHERE username = ? AND password = ?", req.Username, req.Password).Scan(&idAccount, &username, &role)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(model.Response{
			Code:    http.StatusUnauthorized,
			Message: "Username atau password salah",
			Data:    nil,
		})
	}

	// Sukses login
	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Login berhasil",
		Data: fiber.Map{
			"id_account": idAccount,
			"username":   username,
			"role":       role,
		},
	})
}

func addProduct(c *fiber.Ctx) error {
	product := new(model.Product)
	if err := c.BodyParser(product); err != nil {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
			Data:    nil,
		})
	}

	res, err := db.Exec(`
        INSERT INTO products (product_code, product_name, colour, size, stock, price, capital_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
		product.ProductCode, product.ProductName, product.Colour,
		product.Size, product.Stock, product.Price, product.CapitalPrice)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	id, _ := res.LastInsertId()
	product.IDProduct = int(id)

	return c.Status(http.StatusCreated).JSON(model.Response{
		Code:    http.StatusCreated,
		Message: "Product added successfully",
		Data:    product,
	})
}

func editProduct(c *fiber.Ctx) error {
	id := c.Params("id")

	product := new(model.Product)
	if err := c.BodyParser(product); err != nil {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
			Data:    nil,
		})
	}

	_, err := db.Exec(`
        UPDATE products SET product_code=?, product_name=?, colour=?, size=?, stock=?, price=?, capital_price=?, updated_at=CURRENT_TIMESTAMP
        WHERE id_product = ?`,
		product.ProductCode, product.ProductName, product.Colour,
		product.Size, product.Stock, product.Price, product.CapitalPrice, id)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Product updated successfully",
		Data:    nil, // or return the updated product
	})
}

func listProducts(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	offset := (page - 1) * limit

	// Hitung total data
	var total int
	err := db.QueryRow("SELECT COUNT(*) FROM products WHERE is_active = 1").Scan(&total)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	rows, err := db.Query("SELECT id_product, product_code, product_name, colour, size, stock, price, capital_price, is_active, created_at, updated_at FROM products WHERE is_active = 1 LIMIT ? OFFSET ?", limit, offset)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var it model.Product
		if err := rows.Scan(&it.IDProduct, &it.ProductCode, &it.ProductName, &it.Colour, &it.Size,
			&it.Stock, &it.Price, &it.CapitalPrice, &it.IsActive, &it.CreatedAt, &it.UpdatedAt); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(model.Response{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
				Data:    nil,
			})
		}
		products = append(products, it)
	}

	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Products retrieved successfully",
		Data: fiber.Map{
			"items": products,
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

func addTransaction(c *fiber.Ctx) error {
	trx := new(model.Transaction)
	if err := c.BodyParser(trx); err != nil {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
			Data:    nil,
		})
	}

	var stok int

	err := db.QueryRow("SELECT stock FROM products WHERE is_active = 1 and id_product = ?", trx.IDProduct).Scan(&stok)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	if stok < trx.Qty {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: "Stok tidak mencukupi",
			Data:    nil,
		})
	}

	// Insert transaksi
	_, err = db.Exec(`
        INSERT INTO transactions (id_product, product_code, product_name, colour, size, qty, discount, remark, admin_fee)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		trx.IDProduct, trx.ProductCode, trx.ProductName, trx.Colour,
		trx.Size, trx.Qty, trx.Discount, trx.Remark, trx.AdminFee)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	// Update stock produk
	_, err = db.Exec("UPDATE products SET stock = stock - ? WHERE id_product = ?", trx.Qty, trx.IDProduct)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	return c.Status(http.StatusCreated).JSON(model.Response{
		Code:    http.StatusCreated,
		Message: "Transaction added and stock updated successfully",
		Data:    nil,
	})
}

func listTransactions(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	offset := (page - 1) * limit

	var total int
	err := db.QueryRow("SELECT COUNT(*) FROM transactions").Scan(&total)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	rows, err := db.Query("SELECT id_transaction, id_product, product_code, product_name, colour, size, qty, discount, admin_fee, remark, created_at FROM transactions WHERE is_active = 1 LIMIT ? OFFSET ?", limit, offset)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}
	defer rows.Close()

	var trxs []model.Transaction
	for rows.Next() {
		var it model.Transaction
		if err := rows.Scan(&it.IDTransaction, &it.IDProduct, &it.ProductCode, &it.ProductName,
			&it.Colour, &it.Size, &it.Qty, &it.Discount, &it.AdminFee, &it.Remark, &it.CreatedAt); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(model.Response{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
				Data:    nil,
			})
		}
		trxs = append(trxs, it)
	}
	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Transactions retrieved successfully",
		Data: fiber.Map{
			"items": trxs,
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// Edit transaksi
func editTransaction(c *fiber.Ctx) error {
	id := c.Params("id")
	trx := new(model.Transaction)
	if err := c.BodyParser(trx); err != nil {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
			Data:    nil,
		})
	}

	var qtyBefore int

	err := db.QueryRow("SELECT qty FROM transactions WHERE is_active = 1 and id_transaction = ?", trx.IDTransaction).Scan(&qtyBefore)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	var stok int

	err = db.QueryRow("SELECT stock FROM products WHERE is_active = 1 and id_product = ?", trx.IDProduct).Scan(&stok)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	if stok+qtyBefore < trx.Qty {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: "Stok tidak mencukupi",
			Data:    nil,
		})
	}

	_, err = db.Exec(`
		UPDATE transactions SET id_product=?, product_code=?, product_name=?, colour=?, size=?, qty=?, discount=?, admin_fee=?, remark=? WHERE id_transaction = ?`,
		trx.IDProduct, trx.ProductCode, trx.ProductName, trx.Colour,
		trx.Size, trx.Qty, trx.Discount, trx.AdminFee, trx.Remark, id)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	// Update stock produk
	_, err = db.Exec("UPDATE products SET stock = stock + ? WHERE id_product = ?", qtyBefore, trx.IDProduct)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	_, err = db.Exec("UPDATE products SET stock = stock - ? WHERE id_product = ?", trx.Qty, trx.IDProduct)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Transaction updated successfully",
		Data:    nil,
	})
}

// Get transaksi by id
func getTransaction(c *fiber.Ctx) error {
	id := c.Params("id")
	var trx model.Transaction
	err := db.QueryRow("SELECT id_transaction, id_product, product_code, product_name, colour, size, qty, discount, admin_fee, remark, created_at FROM transactions WHERE id_transaction = ?", id).Scan(
		&trx.IDTransaction, &trx.IDProduct, &trx.ProductCode, &trx.ProductName,
		&trx.Colour, &trx.Size, &trx.Qty, &trx.Discount, &trx.AdminFee, &trx.Remark, &trx.CreatedAt)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}
	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Transaction retrieved successfully",
		Data:    trx,
	})
}

func getProduct(c *fiber.Ctx) error {
	id := c.Params("id")

	var product model.Product

	err := db.QueryRow("SELECT id_product, product_code, product_name, colour, size, stock, price, capital_price, is_active, created_at, updated_at FROM products where is_active = 1 and id_product = ?", id).Scan(&product.IDProduct, &product.ProductCode, &product.ProductName, &product.Colour, &product.Size, &product.Stock, &product.Price, &product.CapitalPrice, &product.IsActive, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Product retrieved successfully",
		Data:    product,
	})
}

func generateQR(c *fiber.Ctx) error {
	qr := new(model.GenerateQR)
	if err := c.BodyParser(qr); err != nil {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
			Data:    nil,
		})
	}

	var product model.Product
	err := db.QueryRow("SELECT id_product, product_code, product_name, colour, size, stock, price, capital_price, is_active, created_at, updated_at FROM products where is_active = 1 and id_product = ?", qr.IDProduct).Scan(&product.IDProduct, &product.ProductCode, &product.ProductName, &product.Colour, &product.Size, &product.Stock, &product.Price, &product.CapitalPrice, &product.IsActive, &product.CreatedAt, &product.UpdatedAt)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	filename, err := utils.GenerateQR(product, qr.Qty)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	publicPath := ""
	if idx := len("./public/"); len(filename) > idx && filename[:idx] == "./public/" {
		publicPath = filename[idx:]
	} else {
		publicPath = filename
	}
	url := fmt.Sprintf("http://%s/%s", c.Hostname(), publicPath)
	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: fmt.Sprintf("Generate %v QR Success", qr.Qty),
		Data:    url,
	})
}

func deleteProduct(c *fiber.Ctx) error {
	id := c.Params("id")

	_, err := db.Exec(`
        UPDATE products SET is_active=0 WHERE id_product = ?`, id)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Product delete successfully",
		Data:    nil, // or return the updated product
	})
}

func deleteTransaction(c *fiber.Ctx) error {
	id := c.Params("id")

	_, err := db.Exec(`
        UPDATE transactions SET is_active=0 WHERE id_transaction = ?`, id)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Product delete successfully",
		Data:    nil, // or return the updated product
	})
}

func listSizes(c *fiber.Ctx) error {
	rows, err := db.Query("SELECT id_size, size FROM size")
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}
	defer rows.Close()

	var sizes []model.Size
	for rows.Next() {
		var it model.Size
		if err := rows.Scan(&it.ID, &it.Size); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(model.Response{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
				Data:    nil,
			})
		}
		sizes = append(sizes, it)
	}
	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Sizes retrieved successfully",
		Data:    sizes,
	})
}
