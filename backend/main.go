package main

import (
	"database/sql"
	"fmt"
	"image"
	"image/png"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	_ "modernc.org/sqlite"
	"github.com/skip2/go-qrcode"
	"github.com/fogleman/gg"
)

type Item struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Stock int    `json:"stock"`
}

var db *sql.DB

func main() {
	var err error
	db, err = sql.Open("sqlite", "items.db")
	if err != nil {
		log.Fatal(err)
	}

	// Buat tabel jika belum ada
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS items (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		stock INTEGER
	)`)
	if err != nil {
		log.Fatal(err)
	}

	app := fiber.New()

	// Tambah item
	app.Post("/items", addItem)
	// List item
	app.Get("/items", listItems)
	// Generate QR dengan logo di tengah
	app.Get("/items/:id/qr", generateQR)
	// Scan QR untuk update stok (+/-)
	app.Post("/scan", scanQR)

	log.Fatal(app.Listen(":3000"))
}

func addItem(c *fiber.Ctx) error {
	item := new(Item)
	if err := c.BodyParser(item); err != nil {
		return c.Status(400).SendString(err.Error())
	}

	_, err := db.Exec("INSERT INTO items (name, stock) VALUES (?, ?)", item.Name, item.Stock)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	return c.JSON(fiber.Map{"message": "item added"})
}

func listItems(c *fiber.Ctx) error {
	rows, err := db.Query("SELECT id, name, stock FROM items")
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	defer rows.Close()

	var items []Item
	for rows.Next() {
		var it Item
		if err := rows.Scan(&it.ID, &it.Name, &it.Stock); err != nil {
			return err
		}
		items = append(items, it)
	}
	return c.JSON(items)
}

func generateQR(c *fiber.Ctx) error {
	id := c.Params("id")

	// Buat QR code
	qr, err := qrcode.New(id, qrcode.Medium)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	qrImg := qr.Image(256)

	// Buka logo
	logoFile, err := os.Open("logo-crop.png") // letakkan logo di folder yg sama
	if err != nil {
		return c.Status(500).SendString("Logo not found")
	}
	defer logoFile.Close()

	logo, err := png.Decode(logoFile)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}

	// Gabungkan QR + logo di tengah
	size := 256
	dc := gg.NewContext(size, size)
	dc.DrawImage(qrImg, 0, 0)

	// Resize logo biar muat (misalnya 25% dari QR)
	logoSize := size / 4
	dc.DrawImageAnchored(resizeImage(logo, logoSize, logoSize), size/2, size/2, 0.5, 0.5)

	// Simpan sementara ke file
	outfile := fmt.Sprintf("qrcode_%s.png", id)
	dc.SavePNG(outfile)

	return c.SendFile(outfile)
}

func scanQR(c *fiber.Ctx) error {
	type ScanRequest struct {
		ID     int    `json:"id"`
		Action string `json:"action"` // "add" atau "remove"
	}
	req := new(ScanRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(400).SendString(err.Error())
	}

	var query string
	if req.Action == "add" {
		query = "UPDATE items SET stock = stock + 1 WHERE id = ?"
	} else if req.Action == "remove" {
		query = "UPDATE items SET stock = stock - 1 WHERE id = ?"
	} else {
		return c.Status(400).SendString("invalid action")
	}

	_, err := db.Exec(query, req.ID)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}

	return c.JSON(fiber.Map{"message": "stock updated"})
}

// fungsi resize untuk logo
func resizeImage(img image.Image, w, h int) image.Image {
	dc := gg.NewContext(w, h)
	dc.DrawImageAnchored(img, w/2, h/2, 0.5, 0.5)
	return dc.Image()
}
