package utils

import (
	"app-scan-barcode/model"
	"fmt"
	"image/png"
	"os"
	"time"

	"strconv"
	"strings"

	// "github.com/disintegration/imaging"
	"github.com/fogleman/gg"
	"github.com/go-pdf/fpdf"
	"github.com/gofiber/fiber/v2"
	"github.com/golang/freetype/truetype"
	"github.com/google/uuid"
	"github.com/skip2/go-qrcode"
)

func lerpColor(r1, g1, b1, r2, g2, b2 int, t float64) (int, int, int) {
	r := int(float64(r1) + (float64(r2)-float64(r1))*t)
	g := int(float64(g1) + (float64(g2)-float64(g1))*t)
	b := int(float64(b1) + (float64(b2)-float64(b1))*t)
	return r, g, b
}

func GenerateQRtoFile(c *fiber.Ctx, data model.Product) error {
	// contentAwal := fmt.Sprintf("ocik-gallery-%s-%s", time.Now().Format("2006-01-02"), data.ProductCode)
	uid := uuid.New()
	content := fmt.Sprintf("%s-%v", uid, data.IDProduct)
	barcodeDir := "./public/barcode"
	if _, err := os.Stat(barcodeDir); os.IsNotExist(err) {
		os.MkdirAll(barcodeDir, os.ModePerm)
	}
	outfile := fmt.Sprintf("%s/product-qr-%v.png", barcodeDir, data.IDProduct)
	qrSize := 800
	// logoPath := "./public/ocik-logo.png"
	// logoRatio := 0.10

	// Load font TTF
	fontBytes, err := os.ReadFile("Montserrat-Bold.ttf") // Ganti dengan font kamu
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	ft, err := truetype.Parse(fontBytes)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	faceTitle := truetype.NewFace(ft, &truetype.Options{Size: 50})
	faceSub := truetype.NewFace(ft, &truetype.Options{Size: 40})
	facePrice := truetype.NewFace(ft, &truetype.Options{Size: 50})

	// Ukuran canvas keseluruhan (atas teks + QR + bawah teks)
	qrOffsetY := 20
	canvasHeight := qrSize
	dc := gg.NewContext(qrSize, canvasHeight)

	// Background putih
	dc.SetRGB(1, 1, 1)
	dc.Clear()

	// Teks Atas
	dc.SetFontFace(faceTitle)
	dc.SetRGB(139, 0, 0)
	dc.DrawStringAnchored(fmt.Sprintf("%s - %s", data.ProductName, data.Size), float64(qrSize)/2, 20, 0.5, 0.5)

	dc.SetFontFace(faceSub)
	dc.SetRGB(139, 0, 0)
	dc.DrawStringAnchored(data.Colour, float64(qrSize)/2, 65, 0.5, 0.5)

	// Generate QR code
	qr, err := qrcode.New(content, qrcode.Highest)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	bitmap := qr.Bitmap()
	n := len(bitmap)
	cell := float64(qrSize) / float64(n)

	// Gradient warna
	r1, g1, b1 := 0, 0, 0
	r2, g2, b2 := 0, 0, 0

	// Clear area tengah untuk logo
	// logoW := int(float64(qrSize) * logoRatio)
	// padding := int(float64(qrSize) * 0.001)
	// clearW := logoW + padding*2
	// clearX := (qrSize - clearW) / 2
	// clearY := qrOffsetY + (qrSize-clearW)/2

	dc.Push()
	dc.SetRGB(1, 1, 1)
	// dc.DrawRectangle(float64(clearX), float64(clearY), float64(clearW), float64(clearW))
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

			// if cx+radius > float64(clearX) && cx-radius < float64(clearX+clearW) &&
			// 	cy+radius > float64(clearY) && cy-radius < float64(clearY+clearW) {
			// 	continue
			// }

			dc.DrawCircle(cx, cy, radius)
			dc.Fill()
		}
	}

	// Tambahkan logo
	// logoImg, err := imaging.Open(logoPath)
	// if err != nil {
	// 	return c.Status(500).SendString(err.Error())
	// }
	// resizedLogo := imaging.Resize(logoImg, logoW, 0, imaging.Lanczos)
	// dc.DrawImageAnchored(resizedLogo, qrSize/2, qrOffsetY+qrSize/2, 0.5, 0.5)

	// Teks Harga di bawah QR
	dc.SetFontFace(facePrice)
	dc.SetRGB(0, 0, 139)
	dc.DrawStringAnchored(formatPrice(data.Price), float64(qrSize)/2, float64(qrSize)-40, 0.5, 0.5)

	// Simpan PNG
	outFile, err := os.Create(outfile)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	defer outFile.Close()

	if err := png.Encode(outFile, dc.Image()); err != nil {
		return c.Status(500).SendString(err.Error())
	}

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

func GenerateQR(data model.Product, qty int) (string, error) {
	err := GenerateQRtoFile(&fiber.Ctx{}, data)
	if err != nil {
		return "",err
	}

	barcodeDir := "./public/barcode"
	if _, err := os.Stat(barcodeDir); os.IsNotExist(err) {
		os.MkdirAll(barcodeDir, os.ModePerm)
	}

	printDir := "./public/print"
	if _, err := os.Stat(printDir); os.IsNotExist(err) {
		os.MkdirAll(printDir, os.ModePerm)
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
			fmt.Sprintf("%s/product-qr-%v.png", barcodeDir, data.IDProduct), // hasil dari GenerateQR
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
	filename := fmt.Sprintf("%s/qr-%s-%v-%v.pdf", printDir, time.Now().Format("20060102"), data.IDProduct, qty)
	if err := pdf.OutputFileAndClose(filename); err != nil {
		return "",err
	}
	return filename, nil
}
