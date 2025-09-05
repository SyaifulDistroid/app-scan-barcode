import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Table from "../../component/table";
import { TransactionModal, ProductModal } from "./Modal";
import Swal from "sweetalert2";

export default function AdminPage() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const selectedTab = searchParams.get("tab");
    
    const [tableData, setTableData] = useState({
        items: [],
        limit: 10,
        page: 1,
        total: 0
    })

    const fetchTableData = async (selectedTab:string, page=1, limit=10) => {

        const url = `https://127.0.0.1:3000/${selectedTab == "product" ? "products" : "transactions"}?page=${page}&limit=${limit}`

        try {
            const response = await fetch(url, {
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

            let data = result.data
            if(data.items == null) {
                data.items = []
            }

            setTableData(data)
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "Terdapat Kesalahan Saat Mengambil Data, Silahkan Refresh",
                icon: "error",
            });            
        }
    }

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= Math.ceil(tableData.total / tableData.limit)) {
            fetchTableData(selectedTab as string, newPage, tableData.limit)
        }
    };

    const Transaction = () => {
        const [isModalTrxOpen, setIsModalTrxOpen] = useState({isOpen: false, action: ""});
        const [selectedTrx, setSelectedTrx] = useState(null);

        const handleEditProductClick = (trx) => {
            setSelectedTrx(trx);
            setIsModalTrxOpen({action: "EDIT", isOpen: true});
        };

        const handleClose = () => {
            setIsModalTrxOpen({isOpen: false, action: ""});
            setSelectedTrx(null)
        }
        const handleSaveTrx = () => {
            handleClose()
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
                        {/* <button
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
                        </button> */}
                    </div>
                ),
            },
        ];
        return (
            <div className="w-3/4 flex flex-col gap-10 mx-auto ease-in duration-150">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <span className="font-bold text-3xl text-amber-800">
                        Transaksi
                    </span>

                    <button onClick={() => setIsModalTrxOpen({action: "ADD", isOpen: true})} className="w-full hover:bg-orange-500 duration-100 ease-in max-w-fit font-bold text-white text-center bg-orange-400 px-7 py-3 rounded-full shadow-md">
                        + Tambah Transaksi
                    </button>
                </div>

                <Table
                    data={tableData}
                    columns={transactionColumns}
                    onPageChange={handlePageChange}
                />

                <TransactionModal
                    isOpen={isModalTrxOpen.isOpen}
                    onClose={handleClose}
                    transaction={selectedTrx}
                    onSave={handleSaveTrx}
                    action={isModalTrxOpen.action}
                    callFetchAfterUpdate={() => fetchTableData(selectedTab as string, 1, tableData.limit)}
                />
            </div>
        );
    };

    const Product = () => {
        const [isModalProductOpen, setIsModalProductOpen] = useState({isOpen: false, action: ""});
        const [selectedProduct, setSelectedProduct] = useState(null);

        const handleEditProductClick = (product) => {
            setSelectedProduct(product);
            setIsModalProductOpen({isOpen: true, action: "EDIT"});
        };

        const handleClose = () => {
            setIsModalProductOpen({isOpen: false, action: ""});
            setSelectedProduct(null)
        }
        const handleSaveProduct = () => {
            handleClose()
        };

        const handlePrintProduct = async (selectedProduct) => {
            try {
                const response = await fetch("https://127.0.0.1:3000/print", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({id_product: selectedProduct.id_product, qty: selectedProduct.stock})
                });

                if (response.status != 200 && response.status !== 201) {
                    Swal.fire({
                        title: "Error",
                        text: `Terdapat Kesalahan Saat Mengambil Data, Silahkan Coba Kembali`,
                        icon: "error",
                    });          
                    return       
                }

                const result = await response.json();

                Swal.fire({
                    title: "Sukses",
                    text: `Berhasil Generate QR Code Data`,
                    icon: "success",
                });  

                window.open(result.data, '_blank', 'rel=noopener noreferrer')
        
            } catch (error) {
                Swal.fire({
                    title: "Error",
                    text: `Terdapat Kesalahan Saat Mengambil Data, Silahkan Coba Kembali`,
                    icon: "error",
                });                
            }
        }

        const handleDeleteProduct = async (selectedProduct) => {
            try {
                Swal.fire({
                    title: "Apakah Anda Yakin?",
                    text: "Anda akan menghapus data produk",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Hapuss"
                    }).then(async (result) => {
                    if (result.isConfirmed) {
                        const response = await fetch(`https://127.0.0.1:3000/product/${selectedProduct.id_product}`, {
                            method: "DELETE",
                        });
                
                        if (response.status != 200 && response.status !== 201) {
                            Swal.fire({
                                title: "Error",
                                text: `Terdapat Kesalahan Saat Menghapus Data, Silahkan Coba Kembali`,
                                icon: "error",
                            });            

                            return
                        }
                
                        Swal.fire({
                            title: "Sukses",
                            text: `Berhasil Menghapus Data`,
                            icon: "success",
                        });  
                        fetchTableData(selectedTab as string, 1, tableData.limit)
                    }
                });

            } catch (error) {
                Swal.fire({
                    title: "Error",
                    text: `Terdapat Kesalahan Saat Menghapus Data, Silahkan Coba Kembali`,
                    icon: "error",
                });            
            }
        }


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
                            onClick={() => handleDeleteProduct(item)}
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
                            onClick={() => handlePrintProduct(item)}
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
                <div className="flex flex-col md:flex-row justify-between">
                    <span className="font-bold text-3xl text-amber-800">
                        Produk
                    </span>

                    <button onClick={() => setIsModalProductOpen({action: "ADD", isOpen: true})} className="w-full hover:bg-orange-500 duration-100 ease-in max-w-fit font-bold text-white text-center bg-orange-400 px-7 py-3 rounded-full shadow-md">
                        + Tambah Produk
                    </button>
                </div>

                <Table
                    data={tableData}
                    columns={productColumns}
                    onPageChange={handlePageChange}
                />
                <ProductModal
                    isOpen={isModalProductOpen.isOpen}
                    onClose={handleClose}
                    product={selectedProduct}
                    onSave={handleSaveProduct}
                    action={isModalProductOpen.action}
                    callFetchAfterUpdate={() => fetchTableData(selectedTab as string, 1, tableData.limit)}

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
        } else {
            fetchTableData(selectedTab)
        }
    }, [selectedTab]);


    return (
        <div className="w-full h-full flex flex-col pt-5 justify-between">
            <div className="flex flex-col md:flex-row justify-between items-center">
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
                <div className="w-full md:w-1/2 mx-auto">
                    <div className="w-full rounded-2xl px-3 py-3 bg-white shadow-md flex flex-col md:flex-row gap-3">
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
