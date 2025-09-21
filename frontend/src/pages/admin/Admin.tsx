import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { baseUrlAPI, headersAllowNgrok } from "../../utils/constant";
import { RoleContext } from "../../App";
import ProductPage from "../../component/admin/Product";
import TransactionPage from "../../component/admin/Transaction";

export default function AdminPage() {
  const role = useContext(RoleContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTab = searchParams.get("tab");

  const [tableData, setTableData] = useState({
    items: [],
    limit: 10,
    page: 1,
    total: 0,
  });

  const [masterProductData, setMasterProductData] = useState({
    items: [],
  });

  const resetTableData = () => {
    setTableData({
      items: [],
      limit: 10,
      page: 1,
      total: 0,
    });
  };

  const fetchTableData = async (selectedTab, page = 1, limit = 10, option = null, start_date = new Date().toISOString().split("T")[0], end_date = new Date().toISOString().split("T")[0]) => {
    const url = `${baseUrlAPI}${selectedTab === "product" ? "products" : "transactions"}?page=${page}&limit=${limit}&start_date=${start_date}&end_date=${end_date}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headersAllowNgrok(),
        },
      });

      if (response.status !== 200 && response.status !== 201) {
        Swal.fire({
          title: "Error",
          text: "Terdapat Kesalahan Saat Mengambil Data, Silahkan Refresh",
          icon: "error",
        });
        return;
      }

      const result = await response.json();
      let data = result.data;
      if (data.items === null) {
        data.items = [];
      }

      if (!option?.forMaster) {
        setTableData(data);
      } else {
        // const options = data.items.map((product, index) => ({
        //   label: product.product_name,
        //   value: product.id_product,
        //   detail: JSON.stringify({ ...data.items[index] }),
        // }));
        // setMasterProductData(options);
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Terdapat Kesalahan Saat Mengambil Data, Silahkan Refresh",
        icon: "error",
      });
    }
  };

  const tabMenuList = [
    { value: "product", label: "Manajemen Produk", component: <ProductPage selectedTab={selectedTab} tableData={tableData} setTableData={setTableData} fetchTableData={fetchTableData} /> },
    { value: "transaction", label: "Manajemen Transaksi", component: <TransactionPage selectedTab={selectedTab} tableData={tableData} setTableData={setTableData} fetchTableData={fetchTableData} role={role} /> },
  ];

  const handleChangeTab = (destination) => {
    navigate(`/admin?tab=${destination}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");
    navigate(`/`);
  };

  useEffect(() => {
    if (!selectedTab) {
      navigate(`/admin?tab=product`);
    } else {
      resetTableData();
      fetchTableData(selectedTab);
    }
  }, [selectedTab]);

  return (
    <div className="w-full h-full flex flex-col pt-5 justify-between">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <span className="font-bold text-4xl text-amber-800">
          <img src="/ocik-logo.png" alt="Ocik Gallery" className="inline-block h-10 mr-3 align-middle" />
          Ocik Gallery
        </span>
        <button onClick={handleLogout} className="w-full hover:bg-red-500 duration-100 ease-in max-w-fit font-bold text-white text-center bg-red-400 px-7 py-3 rounded-full shadow-md">
          Log Out
        </button>
      </div>

      <div className="flex flex-col h-full pt-5 pb-40 gap-5">
        <div className="w-full md:w-1/2 mx-auto">
          <div className="w-full rounded-2xl px-3 py-3 bg-white shadow-md flex flex-col md:flex-row gap-3">
            {tabMenuList.map((tab) => (
              <button key={tab.value} onClick={() => handleChangeTab(tab.value)} className={`w-full ease-in-out duration-200 font-bold ${tab.value === selectedTab ? "text-white" : "text-gray-400"} text-center ${tab.value === selectedTab ? "bg-orange-400" : "bg-white"} px-2 py-3 rounded-xl`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {tabMenuList.map((tab) => tab.value === selectedTab ? tab.component : null)}
      </div>

      <span className="text-gray-700 text-center py-5">© Ocik Gallery 2025</span>
    </div>
  );
}