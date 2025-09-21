package main

import (
	"app-scan-barcode/model"
	"app-scan-barcode/utils"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/jung-kurt/gofpdf"
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

	var columnExists bool
	err = db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('transactions') WHERE name='total_price'").Scan(&columnExists)
	if err != nil {
		if err != sql.ErrNoRows {
			log.Fatal(err)
		}
	}

	if !columnExists {
		_, err = db.Exec(`ALTER TABLE transactions ADD COLUMN total_price REAL DEFAULT 0`)
		if err != nil {
			log.Fatal(err)
		}
		log.Println("Kolom total_price berhasil ditambahkan ke tabel transactions")

		// Jalankan migrasi untuk mengisi total_price
		err = migrateTotalPrice(db)
		if err != nil {
			log.Fatal(err)
		}
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
	app.Get("/transactions", listTransactions) //transactions?page=1&limit=20&date=2023-10-10
	app.Put("/transaction/:id", editTransaction)
	app.Get("/transaction/:id", getTransaction)
	app.Delete("/transaction/:id", deleteTransaction)

	// List Size
	app.Get("/sizes", listSizes)

	// Static file untuk akses barcode
	app.Static("/", "./public")
	// QR Code
	app.Post("/print", generateQR)

	// Report
	app.Post("/report", generateReport)

	log.Fatal(app.Listen(":3000"))
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
	var price float64

	err := db.QueryRow("SELECT stock FROM products WHERE is_active = 1 and id_product = ?", trx.IDProduct).Scan(&stok)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	err = db.QueryRow("SELECT price FROM products WHERE is_active = 1 and id_product = ?", trx.IDProduct).Scan(&price)
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

	// Hitung total harga
	totalPrice := (price - trx.Discount - trx.AdminFee) * float64(trx.Qty)

	// Insert transaksi
	_, err = db.Exec(`
        INSERT INTO transactions (id_product, product_code, product_name, colour, size, qty, discount, remark, admin_fee, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		trx.IDProduct, trx.ProductCode, trx.ProductName, trx.Colour,
		trx.Size, trx.Qty, trx.Discount, trx.Remark, trx.AdminFee, totalPrice)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	// Update stock produk
	_, err = db.Exec("UPDATE products SET stock = stock - ? , updated_at=CURRENT_TIMESTAMP WHERE id_product = ?", trx.Qty, trx.IDProduct)
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

	dateFrom := c.Query("start_date")
	dateTo := c.Query("end_date")

	if dateFrom == "" || dateTo == "" {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: "start_date and end_date are required",
			Data:    nil,
		})
	}

	var total int
	err := db.QueryRow(`
		SELECT COUNT(*) 
		FROM transactions 
		WHERE is_active = 1 AND DATE(created_at) BETWEEN ? AND ?`, dateFrom, dateTo).Scan(&total)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	rows, err := db.Query(`
		SELECT id_transaction, id_product, product_code, product_name, colour, size, qty, discount, admin_fee, remark, total_price, created_at 
		FROM transactions 
		WHERE is_active = 1 AND DATE(created_at) BETWEEN ? AND ? 
		LIMIT ? OFFSET ?`, dateFrom, dateTo, limit, offset)
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
			&it.Colour, &it.Size, &it.Qty, &it.Discount, &it.AdminFee, &it.Remark, &it.TotalPrice, &it.CreatedAt); err != nil {
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
	var price float64

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

	err = db.QueryRow("SELECT price FROM products WHERE is_active = 1 and id_product = ?", trx.IDProduct).Scan(&price)
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

	// Hitung total harga
	totalPrice := (price - trx.Discount - trx.AdminFee) * float64(trx.Qty)

	_, err = db.Exec(`
        UPDATE transactions SET id_product=?, product_code=?, product_name=?, colour=?, size=?, qty=?, discount=?, admin_fee=?, remark=?, total_price=? WHERE id_transaction = ?`,
		trx.IDProduct, trx.ProductCode, trx.ProductName, trx.Colour,
		trx.Size, trx.Qty, trx.Discount, trx.AdminFee, trx.Remark, totalPrice, id)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	// Update stock produk
	_, err = db.Exec("UPDATE products SET stock = stock + ? , updated_at=CURRENT_TIMESTAMP WHERE id_product = ?", qtyBefore, trx.IDProduct)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	_, err = db.Exec("UPDATE products SET stock = stock - ? , updated_at=CURRENT_TIMESTAMP WHERE id_product = ?", trx.Qty, trx.IDProduct)
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

func getTransaction(c *fiber.Ctx) error {
	id := c.Params("id")
	var trx model.Transaction
	err := db.QueryRow("SELECT id_transaction, id_product, product_code, product_name, colour, size, qty, discount, admin_fee, remark, total_price, created_at FROM transactions WHERE id_transaction = ?", id).Scan(
		&trx.IDTransaction, &trx.IDProduct, &trx.ProductCode, &trx.ProductName,
		&trx.Colour, &trx.Size, &trx.Qty, &trx.Discount, &trx.AdminFee, &trx.Remark, &trx.TotalPrice, &trx.CreatedAt)
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
        UPDATE products SET is_active=0 , updated_at=CURRENT_TIMESTAMP WHERE id_product = ?`, id)
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

	var idProduct, qty, stok int
	err := db.QueryRow("SELECT id_product, qty FROM transactions WHERE is_active = 1 and id_transaction = ?", id).Scan(&idProduct, &qty)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	_, err = db.Exec(`
        UPDATE transactions SET is_active=0 WHERE id_transaction = ?`, id)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	err = db.QueryRow("SELECT stock FROM products WHERE is_active = 1 and id_product = ?", idProduct).Scan(&stok)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	stok = stok + qty

	_, err = db.Exec(`
        UPDATE products SET stock=? , updated_at=CURRENT_TIMESTAMP WHERE id_product = ?`, stok, idProduct)
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

// Fungsi untuk melakukan migrasi dan mengisi total_price
func migrateTotalPrice(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	rows, err := tx.Query("SELECT id_transaction, id_product, qty, discount, admin_fee FROM transactions")
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var idTransaction, idProduct, qty int
		var discount, adminFee float64

		err = rows.Scan(&idTransaction, &idProduct, &qty, &discount, &adminFee)
		if err != nil {
			return err
		}

		var price float64
		err = tx.QueryRow("SELECT price FROM products WHERE id_product = ?", idProduct).Scan(&price)
		if err != nil {
			if err == sql.ErrNoRows {
				log.Printf("Harga produk tidak ditemukan untuk id_product: %d", idProduct)
				continue // Lanjutkan ke transaksi berikutnya
			} else {
				return err
			}
		}

		totalPrice := (price - discount - adminFee) * float64(qty)

		_, err = tx.Exec("UPDATE transactions SET total_price = ? WHERE id_transaction = ?", totalPrice, idTransaction)
		if err != nil {
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	log.Println("Migrasi total_price berhasil dijalankan")
	return nil
}

func generateReport(c *fiber.Ctx) error {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: "start_date and end_date are required",
			Data:    nil,
		})
	}

	rows, err := db.Query(`
		SELECT id_transaction, id_product, product_code, product_name, colour, size, remark, qty, discount, admin_fee, total_price, created_at 
		FROM transactions 
		WHERE is_active = 1 AND DATE(created_at) BETWEEN ? AND ?`, startDate, endDate)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}
	defer rows.Close()

	// Prepare data for PDF
	var data [][]string
	data = append(data, []string{"No", "Kode Produk", "Nama Produk", "Warna", "Ukuran", "Keterangan", "Qty", "Diskon", "Admin", "Total Harga"})
	var totalPriceSum,disc,admin float64
	var qty int

	no := 1
	for rows.Next() {
		var trx model.Transaction
		if err := rows.Scan(&trx.IDTransaction, &trx.IDProduct, &trx.ProductCode, &trx.ProductName, &trx.Colour, &trx.Size, &trx.Remark, &trx.Qty, &trx.Discount, &trx.AdminFee, &trx.TotalPrice, &trx.CreatedAt); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(model.Response{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
				Data:    nil,
			})
		}

		data = append(data, []string{
			fmt.Sprintf("%d", no),
			trx.ProductCode,
			trx.ProductName,
			trx.Colour,
			trx.Size,
			trx.Remark,
			fmt.Sprintf("%d", trx.Qty),
			utils.FormatFloat(trx.Discount),
			utils.FormatFloat(trx.AdminFee),
			utils.FormatFloat(trx.TotalPrice),
		})
		no++
		disc+= trx.Discount
		admin+= trx.AdminFee
		qty+= trx.Qty
		totalPriceSum += trx.TotalPrice
	}

	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetFont("Arial", "B", 12)
	pdf.AddPage()	
	pdf.Cell(0, 10, fmt.Sprintf("Report Period: %s to %s", startDate, endDate))
	pdf.Ln(15)
	
	// Generate PDF file
	reportFolder := "./public/report"
	if _, err := os.Stat(reportFolder); os.IsNotExist(err) {
		if err := os.MkdirAll(reportFolder, os.ModePerm); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(model.Response{
				Code:    http.StatusInternalServerError,
				Message: "Failed to create report folder",
				Data:    nil,
			})
		}
	}

	filename := fmt.Sprintf("%s/report_%s_to_%s.pdf", reportFolder, startDate, endDate)

	// Add table header
	pdf.CellFormat(12, 10, data[0][0], "1", 0, "C", false, 0, "") // Kolom No lebih kecil
	pdf.CellFormat(33, 10, data[0][1], "1", 0, "C", false, 0, "") // Kolom No lebih kecil
	pdf.CellFormat(33, 10, data[0][2], "1", 0, "C", false, 0, "") // Kolom No lebih kecil
	for _, header := range data[0][3:] {
		pdf.CellFormat(28, 10, header, "1", 0, "C", false, 0, "")
	}
	pdf.Ln(-1)

	// Add table rows
	pdf.SetFont("Arial", "", 10)
	for _, row := range data[1:] {
		pdf.CellFormat(12, 10, row[0], "1", 0, "C", false, 0, "") // Kolom No lebih kecil
		pdf.CellFormat(33, 10, row[1], "1", 0, "C", false, 0, "") // Kolom No lebih kecil
		pdf.CellFormat(33, 10, row[2], "1", 0, "C", false, 0, "") // Kolom No lebih kecil
		for _, col := range row[3:] {
			pdf.CellFormat(28, 10, col, "1", 0, "C", false, 0, "")
    }
    pdf.Ln(-1)
}
	
	totalLabelWidth := 28.0 * 3 + 78 // 9 kolom pertama
	totalValueWidth := 28.0     // kolom terakhir
	
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(totalLabelWidth, 10, "Total", "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, fmt.Sprintf("%v",qty), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(disc), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(admin), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(totalPriceSum), "1", 0, "C", false, 0, "")
	pdf.Ln(-1)

	err = pdf.OutputFileAndClose(filename)
	if err != nil {
		fmt.Println(err.Error())
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create report file",
			Data:    nil,
		})
	}

	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Report generated successfully",
		Data:    fmt.Sprintf("http://%s/report/%s", c.Hostname(), filename[len(reportFolder)+1:]),
	})
}
