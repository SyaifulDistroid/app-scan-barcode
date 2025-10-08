import React, { useState, useEffect } from "react";
import Table from "../../component/table";
import Swal from "sweetalert2";
import { baseUrlAPI, headersAllowNgrok } from "../../utils/constant";
import { TransactionModal } from "../../pages/admin/Modal";
import { formatRupiah } from "../../utils/utils";

export default function TransactionPage({ selectedTab, tableData, setTableData, fetchTableData, role }) {
    const [isModalTrxOpen, setIsModalTrxOpen] = useState({ isOpen: false, action: "" });
    const [selectedTrx, setSelectedTrx] = useState(null);

    const [filterTrx, setFilterTrx] = useState({
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        sizePerPage: 10,
        keyword: '',
    });

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= Math.ceil(tableData.total / tableData.limit)) {
            fetchTableData(selectedTab, newPage, filterTrx.sizePerPage, null, filterTrx.start_date, filterTrx.end_date, filterTrx.keyword);
        }
    };

    const handleChangeSizePerPage = (sizePerPage) => {
        setFilterTrx((prevState) => ({...prevState, sizePerPage: sizePerPage}))
        fetchTableData(selectedTab, 1, sizePerPage, null, filterTrx.start_date, filterTrx.end_date, filterTrx.keyword);
    }

    const handleEditTransactionClick = (trx) => {
        // fetchTableData("product", 1, 9999, { forMaster: true });
        setSelectedTrx(trx);
        setIsModalTrxOpen({ action: "EDIT", isOpen: true });
    };

    const handleClose = () => {
        setIsModalTrxOpen({ isOpen: false, action: "" });
        setSelectedTrx(null);
    };

    const handleSaveTrx = () => {
        handleClose();
    };

    const handleClickAddTransaction = () => {
        // fetchTableData("product", 1, 9999, { forMaster: true });
        setIsModalTrxOpen({ action: "ADD", isOpen: true });
    };

    const handleDeleteTransaction = async (selectedTrx) => {
        try {
            Swal.fire({
                title: "Apakah Anda Yakin?",
                text: "Anda akan menghapus data Transaksi",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Hapus",
                reverseButtons: true,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const response = await fetch(`${baseUrlAPI}/transaction/${selectedTrx.id_transaction}`, {
                        method: "DELETE",
                        headers: headersAllowNgrok(),
                    });

                    if (response.status !== 200 && response.status !== 201) {
                        Swal.fire({
                            title: "Error",
                            text: "Terdapat Kesalahan Saat Menghapus Data, Silahkan Coba Kembali",
                            icon: "error",
                        });
                        return;
                    }

                    Swal.fire({
                        title: "Sukses",
                        text: "Berhasil Menghapus Data",
                        icon: "success",
                    });
                    fetchTableData(selectedTab, tableData.page, filterTrx.sizePerPage, null, filterTrx.start_date, filterTrx.end_date, filterTrx.keyword);
                }
            });
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "Terdapat Kesalahan Saat Menghapus Data, Silahkan Coba Kembali",
                icon: "error",
            });
        }
    };

    const handlePrintReport = async (e) => {
        e.preventDefault()
    
        Swal.fire({
          title: "Loading...",
          text: "Harap Menunggu",
          icon: "info",
          allowOutsideClick: false,
          showConfirmButton: false,
        });
    
        try {    
          const response = await fetch(`${baseUrlAPI}/report?start_date=${filterTrx.start_date}&end_date=${filterTrx.end_date}`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              ...headersAllowNgrok()
            },
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
            text: `Berhasil Generate Report Data`,
            icon: "success",
          });

    
          window.open(result.data, '_blank')
    
        } catch (error) {
          Swal.fire({
            title: "Error",
            text: `Terdapat Kesalahan Saat Mengambil Data, Silahkan Coba Kembali`,
            icon: "error",
          });
        }
    };

    const masterColumnsTransaction = [
        { header: "Kode Produk", key: "product_code" },
        { header: "Nama Produk", key: "product_name" },
        { header: "Warna", key: "colour" },
        { header: "Ukuran", key: "size" },
        { header: "Qty", key: "qty" },
        {
            header: "Diskon",
            key: "discount",
            render: (item) =>
                formatRupiah(item.discount)
        },
        { header: "Keterangan", key: "remark" },
        {
            header: "Total Harga",
            key: "total_price",
            render: (item) =>
                formatRupiah(item.total_price)
        },
        {
            header: "Action",
            key: "actions",
            render: (item) => (
                <div className="w-full flex justify-center gap-2">
                    <button className="p-2 rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 transition" title="Edit" onClick={() => handleEditTransactionClick(item)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button className="p-2 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition" title="Delete" onClick={() => handleDeleteTransaction(item)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            ),
        },
    ];

    const [transactionColumns, setTransactionColumns] = useState([]);

    const handleClickFilter = (e) => {
        e.preventDefault()
        fetchTableData(selectedTab, 1, filterTrx.sizePerPage, null, filterTrx.start_date, filterTrx.end_date, filterTrx.keyword);
    };

    useEffect(() => {
        setTransactionColumns(masterColumnsTransaction.slice(0, role === "owner" ? masterColumnsTransaction.length : masterColumnsTransaction.length - 1));
    }, [role]);

    return (
        <div className="w-full flex flex-col gap-10 mx-auto ease-in duration-150">
            <div className="flex flex-col gap-2 md:flex-row items-center justify-between">
                <form onSubmit={handleClickFilter}>
                    <div className="font-bold flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-800">
                        <input className="bg-white border-gray-400 border-2 p-2 rounded-2xl" value={filterTrx.start_date} onChange={(e) => setFilterTrx((prevState) => ({ ...prevState, start_date: e.target.value }))} name="start_date" type="date" id="dateInput" />
                        <span>S/D</span>
                        <input className="bg-white border-gray-400 border-2 p-2 rounded-2xl" value={filterTrx.end_date} onChange={(e) => setFilterTrx((prevState) => ({ ...prevState, end_date: e.target.value }))} name="end_date" type="date" id="dateInput" />
                        <input className="bg-white border-gray-400 border-2 p-2 rounded-2xl" value={filterTrx.keyword} onChange={(e) => setFilterTrx((prevState) => ({ ...prevState, keyword: e.target.value }))} name="keyword" maxLength={25} placeholder="Search:" type="text"  />
                        <button type="submit" className="w-full flex gap-2 duration-100 ease-in max-w-fit font-bold text-white hover:bg-orange-500 text-center bg-orange-400 px-5 py-2 rounded-full shadow-md">
                            <span>Filter</span>
                        </button>
                    </div>
                </form>
                <div className="flex gap-4 flex-col md:flex-row items-center">
                    <button onClick={handlePrintReport} className="w-full flex gap-2 duration-100 ease-in max-w-fit font-bold text-gray-500 border-2 border-gray-500 hover:bg-gray-100 text-center bg-white px-5 py-3 rounded-full shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                        </svg>
                        <span>Print Report</span>
                    </button>
                    <button onClick={handleClickAddTransaction} className="w-full hover:bg-orange-500 duration-100 ease-in max-w-fit font-bold text-2xl text-white text-center bg-orange-400 px-5 py-3 rounded-full shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>
            </div>
            <Table data={tableData} columns={transactionColumns} onPageChange={handlePageChange} handleChangeSizePerPage={handleChangeSizePerPage} />
            <TransactionModal isOpen={isModalTrxOpen.isOpen} onClose={handleClose} transaction={selectedTrx} onSave={handleSaveTrx} action={isModalTrxOpen.action} callFetchAfterUpdate={() => fetchTableData(selectedTab, 1, filterTrx.sizePerPage, null, filterTrx.start_date, filterTrx.end_date,filterTrx.keyword)} />
        </div>
    );
}