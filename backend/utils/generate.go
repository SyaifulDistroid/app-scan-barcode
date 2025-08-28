package utils

import (
	"app-scan-barcode/model"
	"fmt"
	"image/png"
	"os"
	"time"

	"strconv"
	"strings"

	"github.com/disintegration/imaging"
	"github.com/fogleman/gg"
	"github.com/go-pdf/fpdf"
	"github.com/gofiber/fiber/v2"
	"github.com/golang/freetype/truetype"
	"github.com/skip2/go-qrcode"
)

func lerpColor(r1, g1, b1, r2, g2, b2 int, t float64) (int, int, int) {
	r := int(float64(r1) + (float64(r2)-float64(r1))*t)
	g := int(float64(g1) + (float64(g2)-float64(g1))*t)
	b := int(float64(b1) + (float64(b2)-float64(b1))*t)
	return r, g, b
}

func GenerateQRtoFile(c *fiber.Ctx, data model.Product) error {
	content := fmt.Sprintf("%s-%s-%v", time.Now().Format("2006-01-02"), data.ProductCode, data.IDProduct)
	outfile := "product-qr.png"
	qrSize := 800
	logoPath := "ocik-logo.png"
	logoRatio := 0.18

	// Load font TTF
	fontBytes, err := os.ReadFile("Ubuntu.ttf") // Ganti dengan font kamu
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	ft, err := truetype.Parse(fontBytes)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	faceTitle := truetype.NewFace(ft, &truetype.Options{Size: 32})
	faceSub := truetype.NewFace(ft, &truetype.Options{Size: 28})
	facePrice := truetype.NewFace(ft, &truetype.Options{Size: 30})

	// Ukuran canvas keseluruhan (atas teks + QR + bawah teks)
	qrOffsetY := 20
	canvasHeight := qrSize
	dc := gg.NewContext(qrSize, canvasHeight)

	// Background putih
	dc.SetRGB(1, 1, 1)
	dc.Clear()

	// Teks Atas
	dc.SetFontFace(faceTitle)
	dc.SetRGB(0.1, 0.1, 0.4) // biru tua
	dc.DrawStringAnchored(fmt.Sprintf("%s - %s", data.ProductName, data.Size), float64(qrSize)/2, 30, 0.5, 0.5)

	dc.SetFontFace(faceSub)
	dc.DrawStringAnchored(data.Colour, float64(qrSize)/2, 70, 0.5, 0.5)

	// Generate QR code
	qr, err := qrcode.New(content, qrcode.Highest)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	bitmap := qr.Bitmap()
	n := len(bitmap)
	cell := float64(qrSize) / float64(n)

	// Gradient warna
	r1, g1, b1 := 45, 64, 89
	r2, g2, b2 := 255, 127, 50

	// Clear area tengah untuk logo
	logoW := int(float64(qrSize) * logoRatio)
	padding := int(float64(qrSize) * 0.02)
	clearW := logoW + padding*2
	clearX := (qrSize - clearW) / 2
	clearY := qrOffsetY + (qrSize-clearW)/2

	dc.Push()
	dc.SetRGB(1, 1, 1)
	dc.DrawRectangle(float64(clearX), float64(clearY), float64(clearW), float64(clearW))
	dc.Fill()
	dc.Pop()

	// Gambar QR modul
	for y := 0; y < n; y++ {
		for x := 0; x < n; x++ {
			if !bitmap[y][x] {
				continue
			}

			t := float64(y) / float64(n-1)
			r, g, b := lerpColor(r1, g1, b1, r2, g2, b2, t)
			dc.SetRGB255(r, g, b)

			cx := (float64(x) + 0.5) * cell
			cy := (float64(y)+0.5)*cell + float64(qrOffsetY)
			radius := cell * 0.45

			if cx+radius > float64(clearX) && cx-radius < float64(clearX+clearW) &&
				cy+radius > float64(clearY) && cy-radius < float64(clearY+clearW) {
				continue
			}

			dc.DrawCircle(cx, cy, radius)
			dc.Fill()
		}
	}

	// Tambahkan logo
	logoImg, err := imaging.Open(logoPath)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	resizedLogo := imaging.Resize(logoImg, logoW, 0, imaging.Lanczos)
	dc.DrawImageAnchored(resizedLogo, qrSize/2, qrOffsetY+qrSize/2, 0.5, 0.5)

	// Teks Harga di bawah QR
	dc.SetFontFace(facePrice)
	dc.SetRGB(0.85, 0.3, 0.1)
	dc.DrawStringAnchored(formatPrice(data.Price), float64(qrSize)/2, float64(qrSize)-35, 0.5, 0.5)

	// Simpan PNG
	outFile, err := os.Create(outfile)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	defer outFile.Close()

	if err := png.Encode(outFile, dc.Image()); err != nil {
		return c.Status(500).SendString(err.Error())
	}
	fmt.Println("QR custom berhasil dibuat:", outfile)

	return nil
}

func formatPrice(price float64) string {
	intPrice := int(price)
	priceStr := strconv.Itoa(intPrice)
	var result strings.Builder

	for i, digit := range priceStr {
		if i > 0 && (len(priceStr)-i)%3 == 0 {
			result.WriteString(".")
		}
		result.WriteRune(digit)
	}

	return "Rp. " + result.String() + ",-"
}

func GenerateQR(data model.Product, qty int) error {
	err := GenerateQRtoFile(&fiber.Ctx{}, data)
	if err != nil {
		return err
	}

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Margin & ukuran QR di PDF
	marginLeft := 15.0
	marginTop := 15.0
	qrSize := 30.0 // ukuran per QR (mm)
	spaceX := -3.0
	spaceY := 3.0

	maxCols := int((210 - marginLeft) / (qrSize + spaceX))
	maxRows := int((297 - marginTop) / (qrSize + spaceY))

	col := 0
	row := 0

	for i := 0; i < qty; i++ {
		x := marginLeft + float64(col)*(qrSize+spaceX)
		y := marginTop + float64(row)*(qrSize+spaceY)

		pdf.ImageOptions(
			"product-qr.png", // hasil dari GenerateQR
			x-6, y-6,
			qrSize, qrSize,
			false,
			fpdf.ImageOptions{ImageType: "PNG", ReadDpi: true},
			0,
			"",
		)

		// Next position
		col++
		if col >= maxCols {
			col = 0
			row++
		}
		if row >= maxRows {
			// Add new page
			pdf.AddPage()
			col = 0
			row = 0
		}
	}

	// 3. Simpan PDF
	filename := fmt.Sprintf("qr_%s.pdf", time.Now().Format("20060102150405"))
	if err := pdf.OutputFileAndClose(filename); err != nil {
		return err
	}
	fmt.Println("PDF berhasil dibuat:", filename)
	return nil
}
