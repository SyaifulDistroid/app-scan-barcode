import { Scanner } from "@yudiel/react-qr-scanner";
import React, { useState, useEffect, useRef } from "react";
import { TransactionModal } from "../admin/Modal";
import Swal from "sweetalert2";
import { baseUrlAPI } from "../../utils/constant";

// Karena komponen '@yudiel/react-qr-scanner' tidak dapat dimuat,
// kita akan membuat komponen simulasi scanner sederhana untuk mendemonstrasikan logika.

// Fungsi untuk format mata uang
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Komponen Modal Detail Produk
const ProductDetailModal = ({ isOpen, onClose, product }) => {
    if (!isOpen || !product) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm sm:max-w-lg flex flex-col gap-4 sm:gap-6">
                <span className="font-bold text-xl sm:text-2xl text-amber-800 text-center">
                    Detail Produk
                </span>

                <div className="flex flex-col gap-3 text-gray-700">
                    <div className="flex justify-between items-center">
                        <span className="font-bold">Kode Produk:</span>
                        <span>{product.product_code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold">Nama Produk:</span>
                        <span>{product.product_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold">Warna / Ukuran:</span>
                        <span>{`${product.colour} / ${product.size}`}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold">Stok Tersedia:</span>
                        <span className="text-orange-600 font-semibold">
                            {product.stock}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold">Harga Jual:</span>
                        <span>{formatCurrency(product.price)}</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-full font-bold text-white bg-orange-400 hover:bg-orange-500 transition duration-200 ease-in shadow-md w-full mt-4"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
};

// Komponen Halaman Utama untuk Scanner
export default function ScanPage() {
    const [isModalTrxOpen, setIsModalTrxOpen] = useState({isOpen: false, action: ""});
    const [scannedProduct, setScannedProduct] = useState({
        id_product: null,
        product_code: "",
        product_name: "",
        colour:"",
        size:"",
        stock: 0,
        price: 0,
        capital_price:0
    });
    const [message, setMessage] = useState(
        "Ready To Scan"
    );
    const [isSimulating, setIsSimulating] = useState(false);
    const [scannedCode, setScannedCode] = useState("");

    const getProductDetailByID =  async (productId) => {
        try {
            const response = await fetch(`${baseUrlAPI}product/${productId}`, {
                method: "GET",
            });

            if (response.status != 200 && response.status !== 201) {
                Swal.fire({
                    title: "Error",
                    text: "Terdapat Kesalahan Saat Mengambil Data, Silahkan Refresh",
                    icon: "error",
                });      
                
                return
            }

            const result = await response.json();

            setScannedProduct({
                ...scannedProduct,
                id_product: productId,
                ...result.data
            });
            
            setIsModalTrxOpen({action: "SCAN", isOpen: true})
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "Terdapat Kesalahan Saat Mengambil Data, Silahkan Refresh",
                icon: "error",
            });            
        }
    }

    const handleScan = (resultValue) => {
        if (resultValue && resultValue.length > 0) {
            const scannedCode = resultValue[0].rawValue;
            // Cari produk yang cocok dengan kode yang dipindai
            if (scannedCode) {
                const splittedCode = scannedCode.split("-")
                getProductDetailByID(splittedCode[splittedCode.length - 1])
            } else {
                setMessage(
                    `Produk dengan kode "${scannedCode}" tidak ditemukan.`
                );
                setScannedProduct(null);
            }
        }
    };
    
    const handleSaveTrx = () => {
        setIsModalTrxOpen({isOpen: false, action: ""});
    }

    const SimulatedScanner = () => {
        return (
            <div className="w-full h-full flex flex-col justify-center items-center gap-4">
                <div className=" bg-gray-200 rounded-xl flex items-center justify-center">
                    {true ? (
                        <Scanner onScan={(result) => handleScan(result)} />
                        // <button onClick={() => handleScan([{rawValue: "1-2-3-4-5-6-2"}])}>INI BISA</button>
                    ) : (
                        <span className="text-sm font-bold text-gray-500">
                            Kamera
                        </span>
                    )}
                </div>
                {/* <button
                    onClick={handleSimulateScan}
                    disabled={isSimulating}
                    className={`px-6 py-3 rounded-full font-bold text-white transition duration-200 ease-in shadow-md ${
                        isSimulating
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-orange-400 hover:bg-orange-500"
                    }`}
                >
                    {isSimulating ? "Memindai..." : "Mulai Pindai"}
                </button> */}
            </div>
        );
    };

    return (
        <div className="w-full h-screen flex flex-col justify-center items-center">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-6 text-center">
                <span className="font-bold text-3xl text-amber-800">
                    Scanner Produk
                </span>
                <div className="w-full aspect-square overflow-hidden rounded-xl shadow-inner border-2 border-orange-400">
                    <SimulatedScanner />
                </div>
                <p className="text-gray-600 font-semibold">
                    {message} {scannedCode && `: ${scannedCode}`}
                </p>
            </div>
            <TransactionModal
                isOpen={isModalTrxOpen.isOpen}
                onClose={() => setIsModalTrxOpen({action: "", isOpen: false})}
                transaction={scannedProduct}
                onSave={handleSaveTrx}
                action={isModalTrxOpen.action}
                callFetchAfterUpdate={null}
            />

        </div>
    );
}
