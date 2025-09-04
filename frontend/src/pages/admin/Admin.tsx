import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Table from "../../component/table";
import { TransactionModal, ProductModal } from "./Modal";

export const dummyProductList = [
    {
        id_product: 1,
        product_code: "TS-BLK-M",
        product_name: "Kaos Polos",
        colour: "Hitam",
        size: "M",
        stock: 50,
        price: 125000.0,
        capital_price: 75000.0,
        is_active: 1,
        created_at: "2024-05-20T10:00:00Z",
        updated_at: "2024-05-20T10:00:00Z",
    },
    {
        id_product: 2,
        product_code: "TS-WHT-L",
        product_name: "Kaos Polos",
        colour: "Putih",
        size: "L",
        stock: 35,
        price: 125000.0,
        capital_price: 75000.0,
        is_active: 1,
        created_at: "2024-05-20T10:05:00Z",
        updated_at: "2024-05-20T10:05:00Z",
    },
    {
        id_product: 3,
        product_code: "JP-NAV-S",
        product_name: "Jaket Parasut",
        colour: "Navy",
        size: "S",
        stock: 20,
        price: 250000.0,
        capital_price: 150000.0,
        is_active: 1,
        created_at: "2024-05-20T10:10:00Z",
        updated_at: "2024-05-20T10:10:00Z",
    },
    {
        id_product: 4,
        product_code: "SP-BLU-30",
        product_name: "Celana Jeans",
        colour: "Biru",
        size: "30",
        stock: 15,
        price: 300000.0,
        capital_price: 200000.0,
        is_active: 1,
        created_at: "2024-05-20T10:15:00Z",
        updated_at: "2024-05-20T10:15:00Z",
    },
    {
        id_product: 5,
        product_code: "SP-BLK-32",
        product_name: "Celana Jeans",
        colour: "Hitam",
        size: "32",
        stock: 10,
        price: 300000.0,
        capital_price: 200000.0,
        is_active: 1,
        created_at: "2024-05-20T10:20:00Z",
        updated_at: "2024-05-20T10:20:00Z",
    },
];

export const dummyTransactionList = [
    {
        id_transaction: 1,
        id_product: 1,
        product_code: "TS-BLK-M",
        product_name: "Kaos Polos",
        colour: "Hitam",
        size: "M",
        qty: 1,
        discount: 0,
        admin_fee: 2500,
        remark: "Penjualan via Toko Offline",
        created_at: "2025-09-03T10:00:00Z",
    },
    {
        id_transaction: 2,
        id_product: 3,
        product_code: "JP-NAV-S",
        product_name: "Jaket Parasut",
        colour: "Navy",
        size: "S",
        qty: 1,
        discount: 10000,
        admin_fee: 0,
        remark: "Penjualan via Shopee",
        created_at: "2025-09-03T11:30:00Z",
    },
    {
        id_transaction: 3,
        id_product: 2,
        product_code: "TS-WHT-L",
        product_name: "Kaos Polos",
        colour: "Putih",
        size: "L",
        qty: 2,
        discount: 0,
        admin_fee: 3000,
        remark: "Penjualan via Tokopedia",
        created_at: "2025-09-03T12:45:00Z",
    },
    {
        id_transaction: 4,
        id_product: 5,
        product_code: "SP-BLK-32",
        product_name: "Celana Jeans",
        colour: "Hitam",
        size: "32",
        qty: 1,
        discount: 5000,
        admin_fee: 0,
        remark: "Penjualan via WhatsApp",
        created_at: "2025-09-03T14:00:00Z",
    },
    {
        id_transaction: 5,
        id_product: 4,
        product_code: "SP-BLU-30",
        product_name: "Celana Jeans",
        colour: "Biru",
        size: "30",
        qty: 1,
        discount: 0,
        admin_fee: 4500,
        remark: "Penjualan via Shopee",
        created_at: "2025-09-03T15:15:00Z",
    },
];

export default function AdminPage() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const selectedTab = searchParams.get("tab");

    const Transaction = () => {
        const [isModalTrxOpen, setIsModalTrxOpen] = useState({isOpen: false, action: ""});
        const [selectedTrx, setSelectedTrx] = useState(null);

        const handleEditProductClick = (trx) => {
            setSelectedTrx(trx);
            setIsModalTrxOpen({action: "EDIT", isOpen: true});
        };

        const handleSaveProduct = (editedProduct) => {
            // setProducts(products.map(p =>
            //   p.id_product === editedProduct.id_product ? editedProduct : p
            // ));
            // setIsModalOpen(false);
        };
        const transactionColumns = [
            {
                header: "Kode",
                key: "product_code",
            },
            {
                header: "Nama Produk",
                key: "product_name",
            },
            {
                header: "Warna",
                key: "colour",
            },
            {
                header: "Ukuran",
                key: "size",
            },
            {
                header: "Qty",
                key: "qty",
            },
            {
                header: "Diskon",
                key: "discount",
                render: (item) =>
                    new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(item.discount),
            },
            {
                header: "Admin",
                key: "admin_fee",
                render: (item) =>
                    new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(item.admin_fee),
            },
            {
                header: "Keterangan",
                key: "remark",
            },
            {
                header: "Action",
                key: "actions",
                render: (item) => (
                    <div className="w-full flex justify-center gap-2">
                        <button
                            className="p-2 rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 transition"
                            title="Edit"
                            onClick={() => handleEditProductClick(item)}
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                ></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button
                            className="p-2 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition"
                            title="Delete"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M3 6h18"
                                ></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                ),
            },
        ];
        return (
            <div className="w-3/4 flex flex-col gap-10 mx-auto ease-in duration-150">
                <div className="flex flex-row justify-between">
                    <span className="font-bold text-3xl text-amber-800">
                        Transaksi
                    </span>

                    <button onClick={() => setIsModalTrxOpen({action: "ADD", isOpen: true})} className="w-full hover:bg-orange-500 duration-100 ease-in max-w-fit font-bold text-white text-center bg-orange-400 px-7 py-3 rounded-full shadow-md">
                        + Tambah Transaksi
                    </button>
                </div>

                <Table
                    data={dummyTransactionList}
                    columns={transactionColumns}
                    itemsPerPage={3}
                />

                <TransactionModal
                    isOpen={isModalTrxOpen.isOpen}
                    onClose={() => setIsModalTrxOpen({action: "", isOpen: false})}
                    transaction={selectedTrx}
                    onSave={handleSaveProduct}
                    action={isModalTrxOpen.action}
                />
            </div>
        );
    };

    const Product = () => {
        const [isModalProductOpen, setIsModalProductOpen] = useState({isOpen: false, action: ""});
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [products, setProducts] = useState(dummyProductList);

        const handleEditProductClick = (product) => {
            setSelectedProduct(product);
            setIsModalProductOpen({isOpen: true, action: ""});
        };

        const handleSaveProduct = (editedProduct) => {
            setProducts(
                products.map((p) =>
                    p.id_product === editedProduct.id_product
                        ? editedProduct
                        : p
                )
            );
            setIsModalProductOpen({isOpen: false, action: ""});
        };

        const productColumns = [
            {
                header: "Kode",
                key: "product_code",
            },
            {
                header: "Nama Produk",
                key: "product_name",
            },
            {
                header: "Warna",
                key: "colour",
            },
            {
                header: "Ukuran",
                key: "size",
            },
            {
                header: "Stok",
                key: "stock",
            },
            {
                header: "Harga",
                key: "price",
                // Menggunakan fungsi render untuk kustomisasi tampilan data
                render: (item) =>
                    new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(item.price),
            },
            {
                header: "HPP",
                key: "capital_price",
                render: (item) =>
                    new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(item.capital_price),
            },
            {
                header: "Action",
                key: "actions",
                render: (item) => (
                    <div className="w-full flex justify-center gap-2">
                        <button
                            className="p-2 rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 transition"
                            title="Edit"
                            onClick={() => handleEditProductClick(item)}
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                ></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button
                            className="p-2 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition"
                            title="Delete"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M3 6h18"
                                ></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        <button
                            className="p-2 rounded-full bg-yellow-500 text-white shadow-md hover:bg-yellow-600 transition"
                            title="Print"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 9V2h12v7"
                                ></path>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <path d="M18 14H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"></path>
                            </svg>
                        </button>
                    </div>
                ),
            },
        ];
        return (
            <div className="w-3/4 flex flex-col gap-10 mx-auto ease-in duration-150">
                <div className="flex flex-row justify-between">
                    <span className="font-bold text-3xl text-amber-800">
                        Produk
                    </span>

                    <button onClick={() => setIsModalProductOpen({action: "ADD", isOpen: true})} className="w-full hover:bg-orange-500 duration-100 ease-in max-w-fit font-bold text-white text-center bg-orange-400 px-7 py-3 rounded-full shadow-md">
                        + Tambah Produk
                    </button>
                </div>

                <Table
                    data={dummyProductList}
                    columns={productColumns}
                    itemsPerPage={3}
                />
                <ProductModal
                    isOpen={isModalProductOpen.isOpen}
                    onClose={() => setIsModalProductOpen({action: "", isOpen: false})}
                    product={selectedProduct}
                    onSave={handleSaveProduct}
                    action={isModalProductOpen.action}
                />
            </div>
        );
    };

    const tabMenuList = [
        {
            value: "product",
            label: "Manajemen Produk",
            component: <Product />,
        },
        {
            value: "transaction",
            label: "Manajemen Transaksi",
            component: <Transaction />,
        },
    ];

    const handleChangeTab = (destination: string) => {
        navigate(`/admin?tab=${destination}`);
    };

    const handleLogout = () => {
        navigate(`/`);
    };

    useEffect(() => {
        if (!selectedTab) {
            navigate(`/admin?tab=product`);
        }
    }, [selectedTab]);

    return (
        <div className="w-full h-screen flex flex-col pt-5 justify-between">
            <div className="flex justify-between">
                <span className="font-bold text-4xl text-amber-800">
                    <img src="/ocik-logo.png" alt="Ocik Gallery" className="inline-block h-10 mr-3 align-middle" />
                    Ocik Gallery
                </span>

                <button
                    onClick={handleLogout}
                    className="w-full hover:bg-red-500 duration-100 ease-in max-w-fit font-bold text-white text-center bg-red-400 px-7 py-3 rounded-full shadow-md"
                >
                    Log Out
                </button>
            </div>

            <div className="flex flex-col h-full py-5 gap-5">
                <div className="w-1/2 mx-auto">
                    <div className="w-full rounded-2xl px-3 py-3 bg-white shadow-md flex flex-row gap-3">
                        {tabMenuList.map((tab) => (
                            <button
                                onClick={() => handleChangeTab(tab.value)}
                                className={`w-full ease-in-out duration-200 font-bold ${
                                    tab.value == selectedTab
                                        ? "text-white"
                                        : "text-gray-400"
                                } text-center ${
                                    tab.value == selectedTab
                                        ? "bg-orange-400"
                                        : "bg-white"
                                } px-2 py-3 rounded-xl`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {tabMenuList.map((tab) =>
                    tab.value == selectedTab ? tab.component : null
                )}
            </div>

            <span className="text-gray-700 text-center py-5">
                © Ocik Gallery 2025
            </span>
        </div>
    );
}
