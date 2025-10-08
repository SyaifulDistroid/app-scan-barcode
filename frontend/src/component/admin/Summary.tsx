import React, { useState, useEffect } from "react";
import Table from "../../component/table";
import Swal from "sweetalert2";
import { baseUrlAPI, headersAllowNgrok } from "../../utils/constant";
import { EditAdminFeeModal, TransactionModal } from "../../pages/admin/Modal";
import { formatRupiah } from "../../utils/utils";

export default function SummaryPage({ selectedTab, tableData, setTableData, fetchTableData, role }) {
    const [isModalAdminFeeOpen, setIsModalAdminFeeOpen] = useState({ isOpen: false });
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [masterCategory, setMasterCategory] = useState([]);

    const getFirstDay = () => {
        let date = new Date().toISOString().split("T")[0]
        date = date.split("-")
        date[2] = "01"
        return date.join("-")
    }

    const [filterSummary, setFilterSummary] = useState({
        start_date: getFirstDay(),
        end_date: new Date().toISOString().split("T")[0],
        sizePerPage: 500,
        keyword: "",
    });

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= Math.ceil(tableData.total / tableData.limit)) {
            fetchTableData(selectedTab, newPage, filterSummary.sizePerPage, null, filterSummary.start_date, filterSummary.end_date, filterSummary.keyword);
        }
    };

    const handleChangeSizePerPage = (sizePerPage) => {
        setFilterSummary((prevState) => ({...prevState, sizePerPage: sizePerPage}))
        fetchTableData(selectedTab, 1, sizePerPage, null, filterSummary.start_date, filterSummary.end_date, filterSummary.keyword);
    }

    const fetchMasterCategory = async () => {
    try {
        const response = await fetch(`${baseUrlAPI}/masters/category`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...headersAllowNgrok()
        },
        });
        if (response.status !== 200 && response.status !== 201) return;
        const result = await response.json();
        let data = result.data;
        if (!Array.isArray(data)) data = [];
        const options = data.map((item) => ({
        label: item.master_name,
        value: item.master_name,
        }));
        setMasterCategory(options);
    } catch (error) {
        // handle error
    }
    };

    const handleClose = () => {
        setIsModalAdminFeeOpen({ isOpen: false, action: "" });
        setSelectedTrx(null);
    };

    const handleSaveAdminFee = () => {
        handleClose();
    };

    const handleClickEditAdmin = () => {
        // fetchTableData("product", 1, 9999, { forMaster: true });
        setIsModalAdminFeeOpen({ action: "ADD", isOpen: true });
    };

    const handlePrintSummary = async (e) => {
        e.preventDefault()
    
        Swal.fire({
          title: "Loading...",
          text: "Harap Menunggu",
          icon: "info",
          allowOutsideClick: false,
          showConfirmButton: false,
        });
    
        try {    
          const response = await fetch(`${baseUrlAPI}/report/summary?start_date=${filterSummary.start_date}&end_date=${filterSummary.end_date}&category=${filterSummary.keyword}`, {
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
        { header: "Tanggal", key: "date" },
        {   header: "Omset", 
            key: "total_price",
            render: (item) =>
            formatRupiah(item.total_price)
        },
        {   header: "Harga Modal", 
            key: "total_capital_price",
            render: (item) =>
            formatRupiah(item.total_capital_price)
        },
        // { header: "Shopee Live", key: "colour" }, 
        // { header: "Shopee Live (-)", key: "size" },
        // { header: "Offline", key: "qty" },
        {   header: "Laba", 
            key: "total_profit",
            render: (item) =>
            formatRupiah(item.total_profit)
        },
        { header: "PCS", key: "total_qty" },
        {   header: `Laba Bersih | 19%`, 
            key: "total_net_profit",
            render: (item) =>
            formatRupiah(item.total_net_profit)
        },
    ];

    const [transactionColumns, setTransactionColumns] = useState([]);
    
    const setPercent = () => {
        let column = masterColumnsTransaction.slice(0, role === "owner" ? masterColumnsTransaction.length : masterColumnsTransaction.length - 1)
        column[5].header = `Laba Bersih | ${tableData.admin_fee_percent}%`
        setTransactionColumns(column);
    }

    const handleClickFilter = (e) => {
        e.preventDefault()
        fetchTableData(selectedTab, 1, filterSummary.sizePerPage, null, filterSummary.start_date, filterSummary.end_date, filterSummary.keyword);
    };

    useEffect(() => {
        setTransactionColumns(masterColumnsTransaction.slice(0, role === "owner" ? masterColumnsTransaction.length : masterColumnsTransaction.length - 1));        
        fetchMasterCategory();
    }, [role]);

    useEffect(() => {
        setPercent()
    }, [tableData]);

    return (
        <div className="w-full flex flex-col gap-10 mx-auto ease-in duration-150">
            <div className="text-center flex flex-col gap-5">    
                <div className="flex justify-center">
                    <div className="flex md:flex-row justify-center flex-col gap-5 w-4/5">
                        <div className="flex w-full max-w-sm bg-white flex-col p-5 gap-2 rounded-2xl shadow-lg">
                            <span className="px-5 text-2xl font-bold text-orange-500">Omset</span>
                            <span className="px-5 text-xl font-medium text-gray-900">{formatRupiah(tableData.total_price)}</span>
                        </div>
                        <div className="flex w-full max-w-sm bg-white flex-col p-5 gap-2 rounded-2xl shadow-lg">
                            <span className="px-5 text-2xl font-bold text-orange-500">Laba</span>
                            <span className="px-5 text-xl font-medium text-gray-900">{formatRupiah(tableData.total_profit)}</span>
                        </div>
                        <div className="flex w-full max-w-sm bg-white flex-col p-5 gap-2 rounded-2xl shadow-lg">
                            <span className="px-5 text-2xl font-bold text-orange-500">Laba Bersih</span>
                            <span className="px-5 text-xl font-medium text-gray-900">{formatRupiah(tableData.total_net_profit)}</span>
                        </div>
                        <div className="flex w-full max-w-sm bg-white flex-col p-5 gap-2 rounded-2xl shadow-lg">
                            <span className="px-5 text-2xl font-bold text-orange-500">Total Pcs</span>
                            <span className="px-5 text-xl font-medium text-gray-900">{tableData.total_qty_sum}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-2 md:flex-row items-center justify-between">
                <form onSubmit={handleClickFilter}>
                    <div className="font-bold flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-800">
                        <input className="bg-white border-gray-400 border-2 p-2 rounded-2xl" value={filterSummary.start_date} onChange={(e) => setFilterSummary((prevState) => ({ ...prevState, start_date: e.target.value }))} name="start_date" type="date" id="dateInput" />
                        <span>S/D</span>
                        <input
                            className="bg-white border-gray-400 border-2 p-2 rounded-2xl"
                            value={filterSummary.end_date}
                            onChange={(e) => setFilterSummary((prevState) => ({ ...prevState, end_date: e.target.value }))}
                            name="end_date"
                            type="date"
                            id="dateInput"
                        />
                        <select
                        className="bg-white border-gray-400 border-2 p-2 rounded-2xl"
                        value={filterSummary.keyword}
                        onChange={(e) => setFilterSummary((prevState) => ({ ...prevState, keyword: e.target.value }))}
                        name="Category"
                        >
                        {masterCategory.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                        </select>
                        <button type="submit" className="w-full flex gap-2 duration-100 ease-in max-w-fit font-bold text-white hover:bg-orange-500 text-center bg-orange-400 px-5 py-2 rounded-full shadow-md">
                            <span>Filter</span>
                        </button>
                    </div>
                </form>
                <div className="flex gap-4 flex-col md:flex-row items-center">
                    <button onClick={handlePrintSummary} className="w-full flex gap-2 duration-100 ease-in max-w-fit font-bold text-gray-500 border-2 border-gray-500 hover:bg-gray-100 text-center bg-white px-5 py-3 rounded-full shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                        </svg>
                        <span>Print Summary</span>
                    </button>
                    <button onClick={handleClickEditAdmin} className="w-full hover:bg-orange-500 duration-100 ease-in max-w-fit font-bold text-2xl text-white text-center bg-orange-400 px-5 py-3 rounded-full shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px">
                            <path d="M3 17.25V21h3.75L18.75 9.75l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <Table data={tableData} columns={transactionColumns} onPageChange={handlePageChange} handleChangeSizePerPage={handleChangeSizePerPage} />
            {
                isModalAdminFeeOpen.isOpen &&
                    <EditAdminFeeModal isOpen={isModalAdminFeeOpen.isOpen} onClose={handleClose} existingAdmin={tableData.admin_fee_percent} onSave={handleSaveAdminFee} callFetchAfterUpdate={() => fetchTableData(selectedTab,  1,  filterSummary.sizePerPage,  null,  filterSummary.start_date,  filterSummary.end_date, filterSummary.keyword)} />
            }
        </div>
    );
}