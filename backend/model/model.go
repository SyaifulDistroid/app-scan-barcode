package model

type Product struct {
	IDProduct    int     `json:"id_product"`
	ProductCode  string  `json:"product_code"`
	ProductName  string  `json:"product_name"`
	Colour       string  `json:"colour"`
	Size         string  `json:"size"`
	Stock        int     `json:"stock"`
	Price        float64 `json:"price"`
	CapitalPrice float64 `json:"capital_price"`
	IsActive     int     `json:"is_active"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

type Transaction struct {
	IDTransaction int     `json:"id_transaction"`
	IDProduct     int     `json:"id_product"`
	ProductCode   string  `json:"product_code"`
	ProductName   string  `json:"product_name"`
	Colour        string  `json:"colour"`
	Size          string  `json:"size"`
	Qty           int     `json:"qty"`
	Discount      float64 `json:"discount"`
	AdminFee      float64 `json:"admin_fee"`
	Remark        string  `json:"remark"`
	CreatedAt     string  `json:"created_at"`
}

type GenerateQR struct {
	IDProduct int `json:"id_product"`
	Qty       int `json:"qty"`
}

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type Size struct {
	ID   int    `json:"id_size"`
	Size string `json:"size"`
}
