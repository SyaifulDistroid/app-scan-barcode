package main

import (
	"app-scan-barcode/model"
	"app-scan-barcode/utils"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

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
    CREATE TABLE IF NOT EXISTS master (
        id_master INTEGER PRIMARY KEY AUTOINCREMENT,
        master_code TEXT,
		master_name TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
	app.Post("/print/products", printProducts)

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

	// Summary
	app.Get("/summary", listSummary) //summary?page=1&limit=20&date=2023-10-10
	app.Put("/admin", editAdmin)
	app.Post("/report/summary", printSummary)

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
        INSERT INTO products (product_code, product_name, colour, size, stock, price, capital_price, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		product.ProductCode, product.ProductName, product.Colour,
		product.Size, product.Stock, product.Price, product.CapitalPrice, time.Now(), time.Now())
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
        UPDATE products SET product_code=?, product_name=?, colour=?, size=?, stock=?, price=?, capital_price=?, updated_at=?
        WHERE id_product = ?`,
		product.ProductCode, product.ProductName, product.Colour,
		product.Size, product.Stock, product.Price, product.CapitalPrice, time.Now(), id)
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
	search := c.Query("search")
	offset := (page - 1) * limit

	// Hitung total data
	var total int
	var countQuery = "SELECT COUNT(*) FROM products WHERE is_active = 1"
	var countArgs []interface{}

	if search != "" {
		countQuery += " AND (product_code LIKE ? COLLATE NOCASE OR product_name LIKE ? COLLATE NOCASE OR colour LIKE ? COLLATE NOCASE OR size LIKE ? COLLATE NOCASE)"
		searchLike := "%" + search + "%"
		countArgs = append(countArgs, searchLike, searchLike, searchLike, searchLike)
	}

	err := db.QueryRow(countQuery, countArgs...).Scan(&total)

	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	var args []interface{}
	var strQuery = "SELECT id_product, product_code, product_name, colour, size, stock, price, capital_price, is_active, created_at, updated_at FROM products WHERE is_active = 1"

	if search != "" {
		strQuery += " AND (product_code LIKE ? COLLATE NOCASE OR product_name LIKE ? COLLATE NOCASE OR colour LIKE ? COLLATE NOCASE OR size LIKE ? COLLATE NOCASE)"
		searchLike := "%" + search + "%"
		args = append(args, searchLike, searchLike, searchLike, searchLike)
	}

	strQuery += " ORDER BY product_name ASC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := db.Query(strQuery, args...)

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

	err := db.QueryRow("SELECT stock, price FROM products WHERE is_active = 1 and id_product = ?", trx.IDProduct).Scan(&stok, &price)
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
        INSERT INTO transactions (id_product, product_code, product_name, colour, size, qty, discount, remark, admin_fee, total_price, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		trx.IDProduct, trx.ProductCode, trx.ProductName, trx.Colour,
		trx.Size, trx.Qty, trx.Discount, trx.Remark, trx.AdminFee, totalPrice, time.Now())
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	// Update stock produk
	_, err = db.Exec("UPDATE products SET stock = stock - ? , updated_at=? WHERE id_product = ?", trx.Qty, time.Now(), trx.IDProduct)
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
		ORDER BY product_name ASC
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
	_, err = db.Exec("UPDATE products SET stock = stock + ? , updated_at=? WHERE id_product = ?", qtyBefore, time.Now(), trx.IDProduct)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	_, err = db.Exec("UPDATE products SET stock = stock - ? , updated_at=? WHERE id_product = ?", trx.Qty, time.Now(), trx.IDProduct)
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
        UPDATE products SET is_active=0 , updated_at=? WHERE id_product = ?`, time.Now(), id)
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
		Data:    nil,
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
        UPDATE products SET stock=? , updated_at=? WHERE id_product = ?`, stok, time.Now(), idProduct)
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
	rows, err := db.Query("SELECT id_master, master_name FROM master WHERE master_code = 'SIZE' ORDER BY id_master ASC")
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
	SELECT t.id_product, t.product_code, t.product_name, t.colour, t.size, sum(t.qty) as total_qty, sum(t.discount) as total_discount, sum(t.total_price) as total_price, sum(p.capital_price * t.qty) as total_capital_price
		FROM transactions t
		JOIN products p 
		ON p.id_product = t.id_product 
		WHERE t.is_active = 1 AND DATE(t.created_at) BETWEEN ? AND ?
		group by t.id_product
		ORDER by t.product_name ASC`, startDate, endDate)
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
	data = append(data, []string{"No", "Kode Produk", "Nama Produk", "Warna", "Ukuran", "Qty", "Diskon", "Harga", "HPP", "Profit"})

	no := 1
	qty := 0
	disc := 0
	admin := 0
	totalPriceSum := 0
	totalCapitalPriceSum := 0
	totalProfitSum := 0
	for rows.Next() {
		var trx model.Report
		if err := rows.Scan(&trx.IDProduct, &trx.ProductCode, &trx.ProductName, &trx.Colour, &trx.Size, &trx.TotalQty, &trx.TotalDiscount, &trx.TotalPrice, &trx.TotalCapitalPrice); err != nil {
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
			fmt.Sprintf("%d", trx.TotalQty),
			utils.FormatFloat(trx.TotalDiscount),
			utils.FormatFloat(trx.TotalPrice),
			utils.FormatFloat(trx.TotalCapitalPrice),
			utils.FormatFloat(trx.TotalPrice - trx.TotalCapitalPrice),
		})
		no++
		qty += trx.TotalQty
		disc += int(trx.TotalDiscount)
		admin += int(trx.TotalAdmin)
		totalPriceSum += int(trx.TotalPrice)
		totalCapitalPriceSum += int(trx.TotalCapitalPrice)
		totalProfitSum += int(trx.TotalPrice - trx.TotalCapitalPrice)
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

	colWidths := []float64{12, 30, 30, 30, 20, 30, 30, 30, 30, 30}

	// Add table header
	for i, header := range data[0] {
		pdf.CellFormat(colWidths[i], 10, header, "1", 0, "C", false, 0, "")
	}

	pdf.Ln(-1)

	// Add table rows
	pdf.SetFont("Arial", "", 10)
	for _, row := range data[1:] {
		for i, col := range row {
			pdf.CellFormat(colWidths[i], 10, col, "1", 0, "C", false, 0, "")
		}
		pdf.Ln(-1)
	}

	totalLabelWidth := 12 + 30 + 30 + 30 + 20
	totalValueWidth := 30.0

	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(float64(totalLabelWidth), 10, "Total", "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(qty)), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(disc)), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(totalPriceSum)), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(totalCapitalPriceSum)), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(totalProfitSum)), "1", 0, "C", false, 0, "")
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

func printProducts(c *fiber.Ctx) error {
	var strQuery = "SELECT id_product, product_code, product_name, colour, size, stock, price, capital_price, is_active, created_at, updated_at FROM products WHERE is_active = 1 and stock != 0"

	strQuery += " ORDER BY product_name ASC"

	rows, err := db.Query(strQuery)

	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}
	defer rows.Close()

	var data [][]string
	data = append(data, []string{"No", "Kode Produk", "Nama Produk", "Warna", "Ukuran", "Stok"})
	no := 1

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

		data = append(data, []string{
			fmt.Sprintf("%d", no),
			it.ProductCode,
			it.ProductName,
			it.Colour,
			it.Size,
			fmt.Sprintf("%d", it.Stock),
		})
		no++
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetFont("Arial", "B", 12)
	pdf.AddPage()
	pdf.Cell(0, 10, "Report Products")
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

	filename := fmt.Sprintf("%s/report_products_%s.pdf", reportFolder, time.Now().Format("20060102"))

	colWidths := []float64{15, 35, 35, 35, 35, 35, 35}

	// Add table header
	for i, header := range data[0] {
		pdf.CellFormat(colWidths[i], 10, header, "1", 0, "C", false, 0, "")
	}

	pdf.Ln(-1)

	// Add table rows
	pdf.SetFont("Arial", "", 10)
	for _, row := range data[1:] {
		for i, col := range row {
			pdf.CellFormat(colWidths[i], 10, col, "1", 0, "C", false, 0, "")
		}
		pdf.Ln(-1)
	}

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

func listSummary(c *fiber.Ctx) error {
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
		FROM transactions t 
		JOIN products p
		ON t.id_product = p.id_product 
		WHERE t.is_active = 1 AND DATE(t.created_at) BETWEEN ? AND ?
		GROUP by DATE(t.created_at)`, dateFrom, dateTo).Scan(&total)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	var admin string
	err = db.QueryRow("SELECT master_name FROM master WHERE master_code = 'ADMIN'").Scan(&admin)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	adminFee, err := strconv.ParseFloat(admin, 64)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	rows, err := db.Query(`
	SELECT DATE(t.created_at) as tanggal, sum(t.qty) as total_qty, sum(t.total_price) as total_price , sum(p.capital_price * t.qty) as total_capital_price
		FROM transactions t 
		JOIN products p
		ON t.id_product = p.id_product 
		WHERE t.is_active = 1 AND DATE(t.created_at) BETWEEN ? AND ? 
		GROUP by DATE(t.created_at)
		ORDER by DATE(t.created_at) ASC
		LIMIT ? OFFSET ?`, dateFrom, dateTo, limit, offset)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}
	defer rows.Close()

	totalPriceSum := 0
	totalProfitSum := 0
	TotalNetProfit := 0

	var trxs []model.Summary
	for rows.Next() {
		var it model.Summary
		if err := rows.Scan(&it.Date, &it.TotalQty, &it.TotalPrice, &it.TotalCapitalPrice); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(model.Response{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
				Data:    nil,
			})
		}
		it.TotalProfit = it.TotalPrice - it.TotalCapitalPrice
		it.TotalAdminFee = adminFee * float64(it.TotalQty) / 100
		it.TotalNetProfit = it.TotalProfit - it.TotalAdminFee
		trxs = append(trxs, it)

		totalPriceSum += int(it.TotalPrice)
		totalProfitSum += int(it.TotalProfit)
		TotalNetProfit += int(it.TotalNetProfit)
	}

	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Transactions retrieved successfully",
		Data: fiber.Map{
			"items":             trxs,
			"total_price":       totalPriceSum,
			"total_profit":      totalProfitSum,
			"total_net_profit":  TotalNetProfit,
			"admin_fee_percent": adminFee,
			"total":             total,
			"page":              page,
			"limit":             limit,
		},
	})
}

func editAdmin(c *fiber.Ctx) error {
	admin := new(model.Admin)
	if err := c.BodyParser(admin); err != nil {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
			Data:    nil,
		})
	}

	adminFee, err := strconv.ParseFloat(admin.Admin, 64)
	if err != nil || adminFee < 0 || adminFee > 100 {
		return c.Status(http.StatusBadRequest).JSON(model.Response{
			Code:    http.StatusBadRequest,
			Message: "Admin fee harus antara 0 sampai 100",
			Data:    nil,
		})
	}

	_, err = db.Exec("UPDATE master SET master_name = ? WHERE master_code = 'ADMIN'", admin.Admin)

	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	return c.Status(http.StatusOK).JSON(model.Response{
		Code:    http.StatusOK,
		Message: "Admin updated successfully",
		Data:    nil,
	})
}

func printSummary(c *fiber.Ctx) error {
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
		FROM transactions t 
		JOIN products p
		ON t.id_product = p.id_product 
		WHERE t.is_active = 1 AND DATE(t.created_at) BETWEEN ? AND ?
		GROUP by DATE(t.created_at)`, dateFrom, dateTo).Scan(&total)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	var admin string
	err = db.QueryRow("SELECT master_name FROM master WHERE master_code = 'ADMIN'").Scan(&admin)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	adminFee, err := strconv.ParseFloat(admin, 64)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}

	rows, err := db.Query(`
	SELECT DATE(t.created_at) as tanggal, sum(t.qty) as total_qty, sum(t.total_price) as total_price , sum(p.capital_price * t.qty) as total_capital_price
		FROM transactions t 
		JOIN products p
		ON t.id_product = p.id_product 
		WHERE t.is_active = 1 AND DATE(t.created_at) BETWEEN ? AND ? 
		GROUP by DATE(t.created_at)
		ORDER by DATE(t.created_at) ASC`, dateFrom, dateTo)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(model.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Data:    nil,
		})
	}
	defer rows.Close()

	var data [][]string
	data = append(data, []string{"No", "Tanggal", "Omset", "Laba", "Qty", "Admin", "Laba Bersih"})

	totalPriceSum := 0
	totalProfitSum := 0
	totalNetProfitSum := 0
	totalQtySum := 0
	totalAdminSum := 0
	no := 1

	for rows.Next() {
		var it model.Summary
		if err := rows.Scan(&it.Date, &it.TotalQty, &it.TotalPrice, &it.TotalCapitalPrice); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(model.Response{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
				Data:    nil,
			})
		}
		it.TotalProfit = it.TotalPrice - it.TotalCapitalPrice
		it.TotalAdminFee = adminFee * float64(it.TotalProfit) / 100
		it.TotalNetProfit = it.TotalProfit - it.TotalAdminFee

		data = append(data, []string{
			fmt.Sprintf("%d", no),
			it.Date,
			utils.FormatFloat(it.TotalPrice),
			utils.FormatFloat(it.TotalProfit),
			utils.FormatFloat(float64(it.TotalQty)),
			utils.FormatFloat(it.TotalAdminFee),
			utils.FormatFloat(it.TotalNetProfit),
		})
		no++
		totalPriceSum += int(it.TotalPrice)
		totalProfitSum += int(it.TotalProfit)
		totalNetProfitSum += int(it.TotalNetProfit)
		totalAdminSum += int(it.TotalAdminFee)
		totalQtySum += it.TotalQty
	}

	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetFont("Arial", "B", 12)
	pdf.AddPage()
	pdf.Cell(0, 10, fmt.Sprintf("Report Period: %s to %s", dateFrom, dateTo))
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

	filename := fmt.Sprintf("%s/summary_%s_to_%s.pdf", reportFolder, dateFrom, dateTo)

	colWidths := []float64{12, 30, 30, 30, 30, 30, 30}

	// Add table header
	for i, header := range data[0] {
		pdf.CellFormat(colWidths[i], 10, header, "1", 0, "C", false, 0, "")
	}

	pdf.Ln(-1)

	// Add table rows
	pdf.SetFont("Arial", "", 10)
	for _, row := range data[1:] {
		for i, col := range row {
			pdf.CellFormat(colWidths[i], 10, col, "1", 0, "C", false, 0, "")
		}
		pdf.Ln(-1)
	}

	totalLabelWidth := 12 + 30
	totalValueWidth := 30.0

	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(float64(totalLabelWidth), 10, "Total", "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(totalPriceSum)), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(totalProfitSum)), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(totalQtySum)), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(totalAdminSum)), "1", 0, "C", false, 0, "")
	pdf.CellFormat(totalValueWidth, 10, utils.FormatFloat(float64(totalNetProfitSum)), "1", 0, "C", false, 0, "")
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
		Message: "Summary generated successfully",
		Data:    fmt.Sprintf("http://%s/report/%s", c.Hostname(), filename[len(reportFolder)+1:]),
	})
}
