import React, { useState, useEffect, act } from 'react';
import Swal from 'sweetalert2';
import { baseUrlAPI, headersAllowNgrok } from '../../utils/constant';
import Select from 'react-select';


export function ProductModal({ isOpen, onClose, product: editedProduct, onSave, action, callFetchAfterUpdate }) {
  // Ambil role dari localStorage, bisa diganti sesuai kebutuhan
  const role = localStorage.getItem('role');
  const isOwner = role === 'owner';
  if (!isOpen) {
    return null;
  }

  const [selectedMaster, setSelectedMaster] = useState({ size: {}, category: {} })
  const [masterData, setMasterData] = useState({ size: [], category: [] })

  const [formData, setFormData] = useState({
    product_code: "",
    product_name: "",
    colour: "",
    size: "",
    category : "",
    stock: 0,
    price: 0,
    capital_price: 0
  })

  useEffect(() => {
    if (editedProduct && action == "EDIT") {
      setFormData(editedProduct)
    }
  }, [editedProduct])

  const resetFormData = () => {
    setFormData({
      product_code: "",
      product_name: "",
      colour: "",
      size: "",
      category : "",
      stock: 0,
      price: 0,
      capital_price: 0
    })

  setSelectedMaster({ size: {}, category: {} })
  }

  const handleCancel = () => {
    resetFormData()
    onClose()
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()

    Swal.fire({
      title: "Loading...",
      text: "Harap Menunggu",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    try {
      let payload = formData

      payload.stock = parseInt(payload.stock)
      payload.price = parseInt(payload.price)
      payload.capital_price = parseInt(payload.capital_price)

      let url = ""

      if (action == "EDIT") {
        url = `${baseUrlAPI}/product/${editedProduct.id_product}`
        payload.id_product = editedProduct.id_product
      } else if (action == "ADD") {
        url = `${baseUrlAPI}/products`
      }

      const response = await fetch(url, {
        method: action == "EDIT" ? "PUT" : "POST",
        headers: {
          'Content-Type': 'application/json',
          ...headersAllowNgrok()
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json()

      if (response.status != 200 && response.status !== 201) {
        Swal.fire({
          title: "Error",
          text: result.message || `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Tambah"} Data, Silahkan Coba Kembali`,
          icon: "error",
        });

        return
      }

      Swal.fire({
        title: "Sukses",
        text: `Berhasil ${action == "EDIT" ? 'Edit' : "Tambah"} Data`,
        icon: "success",
      });
      if (callFetchAfterUpdate) {
        callFetchAfterUpdate()
      }
      onClose()
      resetFormData()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Tambah"} Data, Silahkan Coba Kembali`,
        icon: "error",
      });
      resetFormData()
    }
  };

  const handleChangeField = (e) => {
    const { name, value } = e.target

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }


  const handleChangeSelectMaster = (type, selected) => {
    setSelectedMaster((prev) => ({ ...prev, [type]: selected }))
    setFormData((prevData) => ({
      ...prevData,
      [type]: selected.label
    }))
  }


  // Generic fetch master data
  const fetchMasterData = async (type) => {
    const url = `${baseUrlAPI}/masters/${type}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headersAllowNgrok()
        },
      });
      if (response.status != 200 && response.status !== 201) {
        Swal.fire({
          title: "Error",
          text: `Terdapat Kesalahan Saat Mengambil Data ${type}, Silahkan Refresh`,
          icon: "error",
        });
        return
      }
      const result = await response.json();
      let data = result.data
      if (!Array.isArray(data)) data = []
      const options = data.map((item) => ({
        label: item.master_name,
        value: item.id_master,
      }))
      setMasterData((prev) => ({ ...prev, [type]: options }))
      if (action == "EDIT" && editedProduct && editedProduct[type]) {
        setSelectedMaster((prev) => ({
          ...prev,
          [type]: options.find((item) => item.label == editedProduct[type]) || {}
        }))
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Terdapat Kesalahan Saat Mengambil Data ${type}, Silahkan Refresh`,
        icon: "error",
      });
    }
  }

  useEffect(() => {
  fetchMasterData("size")
  fetchMasterData("category")
  }, [action, editedProduct])

  return (
    <div className='fixed inset-0 bg-black/30 flex justify-center items-center z-50'>
      <div className='bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg flex flex-col gap-6'>
        <span className='font-bold text-2xl text-amber-800 text-center'>{action == "EDIT" ? "Edit" : "Tambah"} Produk</span>
        <form onSubmit={handleSubmitForm} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Kode Produk</label>
            <input
              type='text'
              name='product_code'
              defaultValue={formData.product_code}
              onChange={handleChangeField}
              required
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Nama Produk</label>
            <input
              type='text'
              name='product_name'
              defaultValue={formData.product_name}
              onChange={handleChangeField}
              required
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Warna</label>
            <input
              type='text'
              name='colour'
              defaultValue={formData.colour}
              onChange={handleChangeField}
              required
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Ukuran</label>
            <Select required value={selectedMaster.size} name='size' onChange={(value) => handleChangeSelectMaster("size", value)} options={masterData.size} styles={{
              control: (baseStyles) => ({
                ...baseStyles,
                border: "1px solid gray",
                padding: "8px 6px",
                borderRadius: "12px"
              })
            }} />
          </div>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Kategori</label>
            <Select required value={selectedMaster.category} name='category' onChange={(value) => handleChangeSelectMaster("category", value)} options={masterData.category} styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                border: "1px solid gray",
                padding: "8px 6px",
                borderRadius: "12px"
              })
            }} />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Stok</label>
            <input
              type='number'
              name='stock'
              defaultValue={formData.stock || editedProduct?.stock || "0"}
              onChange={handleChangeField}
              onFocus={(e) => e.target.select()} 
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Harga</label>
            <input
              type='number'
              name='price'
              defaultValue={formData.price || editedProduct?.price || "0"}
              onChange={handleChangeField}
              onFocus={(e) => e.target.select()}    
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>
          {isOwner && (
            <div className='flex flex-col gap-2'>
              <label className='font-bold text-gray-700'>HPP</label>
              <input
                type='number'
                name='capital_price'
                defaultValue={formData.capital_price || editedProduct?.capital_price || "0"}
                onChange={handleChangeField}
                className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
                disabled={!isOwner}
              />
              {!isOwner && (
                <span className='text-xs text-red-500'>Hanya owner yang dapat mengubah HPP</span>
              )}
            </div>
          )}
          <div className='flex justify-end gap-3 mt-4'>
            <button
              onClick={handleCancel}
              type='button'
              className='px-6 py-3 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-200 ease-in'
            >
              Batal
            </button>
            <button
              type='submit'
              className='px-6 py-3 rounded-full font-bold text-white bg-orange-400 hover:bg-orange-500 transition duration-200 ease-in shadow-md'
            >
              Simpan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export function TransactionModal({ isOpen, onClose, transaction: editedTransaction, onSave, action, callFetchAfterUpdate }) {

  if (!isOpen) {
    return null;
  }

  const [selectedMasterProduct, setSelectedMasterProduct] = useState({})
  
  const [masterDataProduct, setMasterDataProduct] = useState({
      items: [],
  });


  const [formData, setFormData] = useState({
    id_product: null,
    product_code: "",
    product_name: "",
    colour: "",
    size: "",
    qty: action == "SCAN" ? 1 : 0,
    discount: 0,
    remark: "",
    // total_price: 0,
  })

  useEffect(() => {
    if (editedTransaction) {
      setFormData({ ...formData, ...editedTransaction })
    }
  }, [editedTransaction])

  const resetFormData = () => {
    setFormData({
      id_product: null,
      product_code: "",
      product_name: "",
      colour: "",
      size: "",
      qty: 0,
      discount: 0,
      remark: "",
      // total_price: 0,
    })
  }

  const handleCancel = () => {
    resetFormData()
    onClose()
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()

    Swal.fire({
      title: "Loading...",
      text: "Harap Menunggu",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
    });


    if (!formData.id_product) {
      Swal.fire({
        title: "Perhatikan",
        text: "Product Tidak Boleh Kosong",
        icon: "info",
      });

      return
    }

    if (formData.qty <= 0) {
      Swal.fire({
        title: "Perhatikan",
        text: "Qty tidak bisa 0 atau di bawahnya",
        icon: "info",
      });

      return
    }


    try {
      let payload = formData

      payload.qty = parseInt(payload.qty)
      payload.discount = parseInt(payload.discount)

      let url = ""


      if (action == "EDIT") {
        url = `${baseUrlAPI}/transaction/${editedTransaction.id_transaction}`
        payload.id_transaction = parseInt(editedTransaction.id_transaction)
      } else {
        if (action == "SCAN") {
          payload.id_product = parseInt(editedTransaction.id_product)
        }
        url = `${baseUrlAPI}/transactions`
      }
      const response = await fetch(url, {
        method: action == "EDIT" ? "PUT" : "POST",
        headers: {
          'Content-Type': 'application/json',
          ...headersAllowNgrok()
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json()

      if (response.status != 200 && response.status !== 201) {
        Swal.fire({
          title: "Error",
          text: result?.message || `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Tambah"} Data, Silahkan Coba Kembali`,
          icon: "error",
        });

        return
      }

      Swal.fire({
        title: "Sukses",
        text: `Berhasil ${action == "EDIT" ? 'Edit' : "Tambah"} Data`,
        icon: "success",
      });

      if (callFetchAfterUpdate) {
        callFetchAfterUpdate()
      }

      onClose()
      resetFormData()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Tambah"} Data, Silahkan Coba Kembali`,
        icon: "error",
      });

      resetFormData()
    }
  };

  const handleChangeField = (e) => {
    const { name, value } = e.target

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  const fetchProductData = async (page = 1, limit = 10, option = null) => {
      const url = `${baseUrlAPI}/products?page=${page}&limit=${limit}`;

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

          if (option?.forMaster) {
              const options = data.items.map((product, index) => ({
                  label: product.product_name,
                  value: product.id_product,
                  detail: JSON.stringify({ ...data.items[index] }),
              }));
              setMasterDataProduct(options);
              
              if (action == "EDIT") {
                setSelectedMasterProduct(options.find((product) => (product.value == editedTransaction.id_product))
              )        
            }
          }

      } catch (error) {
          Swal.fire({
              title: "Error",
              text: "Terdapat Kesalahan Saat Mengambil Data, Silahkan Refresh",
              icon: "error",
          });
      }
  };
  
  useEffect(() => {
      fetchProductData(1, 99999, {forMaster: true})
  }, [])

  const handleChangeSelectProduct = (selectedProduct) => {
    setSelectedMasterProduct(selectedProduct)
    selectedProduct = JSON.parse(selectedProduct.detail)

    if (selectedProduct.created_at || selectedProduct.updated_at) {
      selectedProduct.created_at = null
      selectedProduct.updated_at = null
    }

    setFormData((prevData) => ({
      ...prevData,
      ...selectedProduct
    }))
  }

  return (
    <div className='fixed inset-0 bg-black/30 flex justify-center items-center z-50'>
      <div className='bg-white overflow-auto p-8 rounded-2xl shadow-lg w-full max-h-10/12 max-w-lg flex flex-col gap-6'>
        <span className='font-bold text-2xl text-amber-800 text-center'>{action == "EDIT" ? "Edit" : "Tambah"} Transaksi</span>
        <form onSubmit={handleSubmitForm} className='flex flex-col gap-4'>
          {
            (action == "EDIT" || action == "ADD")
            &&
            <div className='flex flex-col gap-2'>
              <label className='font-bold text-gray-700'>Produk</label>
              <Select isDisabled={action == "EDIT"} required value={selectedMasterProduct} name='scanned_product' onChange={(value) => handleChangeSelectProduct(value)} options={masterDataProduct} styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  border: "1px solid gray",
                  padding: "8px 6px",
                  borderRadius: "12px"
                })
              }} />
            </div>
          }
          {
            (action != "EDIT" && action != "ADD")
            &&
            <>
              <div className='flex flex-col gap-2'>
                <label className='font-bold text-gray-700'>Kode Produk</label>
                <input
                  type='text'
                  name='product_code'
                  defaultValue={formData.product_code}
                  onChange={handleChangeField}
                  disabled={action == "SCAN"}
                  className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
                />
              </div>

              <div className='flex flex-col gap-2'>
                <label className='font-bold text-gray-700'>Nama Produk</label>
                <input
                  type='text'
                  name='product_name'
                  defaultValue={formData.product_name}
                  onChange={handleChangeField}
                  disabled={action == "SCAN"}
                  className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
                />
              </div>

              <div className='flex flex-col gap-2'>
                <label className='font-bold text-gray-700'>Warna</label>
                <input
                  type='text'
                  name='colour'
                  defaultValue={formData.colour}
                  onChange={handleChangeField}
                  disabled={action == "SCAN"}
                  className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
                />
              </div>

              <div className='flex flex-col gap-2'>
                <label className='font-bold text-gray-700'>Ukuran</label>
                <input
                  type='text'
                  name='size'
                  defaultValue={formData.size}
                  onChange={handleChangeField}
                  disabled={action == "SCAN"}
                  className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
                />
              </div>
            </>
          }

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Qty</label>
            <input
              type='number'
              name='qty'

              required
              defaultValue={formData.qty || editedTransaction?.qty || "0"}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Diskon</label>
            <input
              type='number'
              name='discount'
              defaultValue={formData.discount || editedTransaction?.discount || "0"}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Keterangan</label>
            <textarea
              name='remark'
              defaultValue={editedTransaction?.remark || ""}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            ></textarea>
          </div>
          <div className='flex justify-end gap-3 mt-4'>
            <button
              onClick={handleCancel}
              className='px-6 py-3 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-200 ease-in'
            >
              Batal
            </button>
            <button
              type='submit'
              className='px-6 py-3 rounded-full font-bold text-white bg-orange-400 hover:bg-orange-500 transition duration-200 ease-in shadow-md'
            >
              Simpan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export function PrintProductModal({ isOpen, onClose, product: selectedProduct, onSave }) {
  const [formData, setFormData] = useState({
    id_product: null,
    qty: 0,
  })

  useEffect(() => {
    if (selectedProduct) {
      setFormData({ ...formData, ...selectedProduct })
    }
  }, [selectedProduct])

  const resetFormData = () => {
    setFormData({
      id_product: null,
      qty: 0,
    })
  }

  const handleCancel = () => {
    resetFormData()
    onClose()
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()

    Swal.fire({
      title: "Loading...",
      text: "Harap Menunggu",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    if (formData.qty <= 0) {
      Swal.fire({
        title: "Perhatikan",
        text: "Qty tidak bisa 0 atau di bawahnya",
        icon: "info",
      });

      return
    }

    try {
      let payload = formData

      payload.qty = parseInt(payload.qty)

      const response = await fetch(`${baseUrlAPI}/print/`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          ...headersAllowNgrok()
        },
        body: JSON.stringify(payload),
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

      window.open(result.data, '_blank')

      onClose()
      resetFormData()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Terdapat Kesalahan Saat Mengambil Data, Silahkan Coba Kembali`,
        icon: "error",
      });
      resetFormData()
    }
  };

  const handleChangeField = (e) => {
    const { name, value } = e.target

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black/30 flex justify-center items-center z-50'>
      <div className='bg-white overflow-auto p-8 rounded-2xl shadow-lg w-full max-h-10/12 max-w-lg flex flex-col gap-6'>
        <span className='font-bold text-2xl text-amber-800 text-center'>Generate QR Produk</span>
        <form onSubmit={handleSubmitForm} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Qty</label>
            <input
              type='number'
              name='qty'
              defaultValue={formData.qty || selectedProduct?.qty || "0"}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex justify-end gap-3 mt-4'>
            <button
              type='button'
              onClick={handleCancel}
              className='px-6 py-3 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-200 ease-in'
            >
              Batal
            </button>
            <button
              type='submit'
              className='px-6 py-3 rounded-full font-bold text-white bg-orange-400 hover:bg-orange-500 transition duration-200 ease-in shadow-md'
            >
              Print
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export function EditAdminFeeModal({ isOpen, onClose, existingAdmin, onSave, callFetchAfterUpdate }) {
  const [formData, setFormData] = useState({
    admin: 0,
  })

  useEffect(() => {
    if (existingAdmin) {
      setFormData({ admin: existingAdmin })
    }
  }, [existingAdmin])

  const resetFormData = () => {
    setFormData({
      admin: 0,
    })
  }

  const handleCancel = () => {
    resetFormData()
    onClose()
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()

    Swal.fire({
      title: "Loading...",
      text: "Harap Menunggu",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    if (formData.admin <= 0) {
      Swal.fire({
        title: "Perhatikan",
        text: "Admin fee tidak bisa 0 atau di bawahnya",
        icon: "info",
      });

      return
    }

    try {
      let payload = formData

      payload.admin = payload.admin.toString()

      const response = await fetch(`${baseUrlAPI}/admin/`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          ...headersAllowNgrok()
        },
        body: JSON.stringify(payload),
      });

      if (response.status != 200 && response.status !== 201) {
        Swal.fire({
          title: "Error",
          text: `Terdapat Kesalahan Saat Mengambil Data, Silahkan Coba Kembali`,
          icon: "error",
        });
        return
      }

      Swal.fire({
        title: "Sukses",
        text: `Berhasil Update Admin Fee`,
        icon: "success",
      });

      if (callFetchAfterUpdate) {
        callFetchAfterUpdate()
      }
      onClose()
      resetFormData()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Terdapat Kesalahan Saat Mengambil Data, Silahkan Coba Kembali`,
        icon: "error",
      });
      resetFormData()
    }
  };

  const handleChangeField = (e) => {
    const { name, value } = e.target

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black/30 flex justify-center items-center z-50'>
      <div className='bg-white overflow-auto p-8 rounded-2xl shadow-lg w-full max-h-10/12 max-w-lg flex flex-col gap-6'>
        <span className='font-bold text-2xl text-amber-800 text-center'>Edit Admin Fee</span>
        <form onSubmit={handleSubmitForm} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Admin Fee</label>
            <input
              type='number'
              name='admin'
              defaultValue={formData.admin || existingAdmin || "0"}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex justify-end gap-3 mt-4'>
            <button
              type='button'
              onClick={handleCancel}
              className='px-6 py-3 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-200 ease-in'
            >
              Batal
            </button>
            <button
              type='submit'
              className='px-6 py-3 rounded-full font-bold text-white bg-orange-400 hover:bg-orange-500 transition duration-200 ease-in shadow-md'
            >
              Simpan
            </button>
          </div>
        </form>

      </div>
    </div>

    
  );
}

export function EditHPPModal({ isOpen, onClose, onSave, callFetchAfterUpdate }) {
  const [products, setProducts] = useState<{ product_name: string; hpp: number }[]>([]);
  const [formData, setFormData] = useState({
    product_name : "",
    hpp: 0,
  })
  

  const fetchProductNames = async () => {
    try {
      const response = await fetch(`${baseUrlAPI}/products/hpp`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          ...headersAllowNgrok()
        },
      });
      if (response.status !== 200 && response.status !== 201) {
        Swal.fire({
          title: "Error",
          text: "Terdapat Kesalahan Saat Mengambil Nama Produk, Silahkan Refresh",
          icon: "error",
        });
        return;
      }
      const result = await response.json();
      setProducts(Array.isArray(result.data?.items) ? result.data.items : []);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Terdapat Kesalahan Saat Mengambil Nama Produk, Silahkan Refresh",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    setFormData({ product_name:'', hpp: 0 })      
    fetchProductNames();
  }, [])

  const resetFormData = () => {
    setFormData({
      product_name : "",
      hpp: 0,
    })
  }

  const handleCancel = () => {
    resetFormData()
    onClose()
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()

    Swal.fire({
      title: "Loading...",
      text: "Harap Menunggu",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    if (formData.hpp <= 0) {
      Swal.fire({
        title: "Perhatikan",
        text: "HPP tidak bisa 0 atau di bawahnya",
        icon: "info",
      });

      return
    }

    try {
      let payload = formData

      payload.hpp = payload.hpp.toString()
      payload.product_name = payload.product_name.toString()

      const response = await fetch(`${baseUrlAPI}/products/hpp`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          ...headersAllowNgrok()
        },
        body: JSON.stringify(payload),
      });

      if (response.status != 200 && response.status !== 201) {
        Swal.fire({
          title: "Error",
          text: `Terdapat Kesalahan Saat Mengambil Data, Silahkan Coba Kembali`,
          icon: "error",
        });
        return
      }

      Swal.fire({
        title: "Sukses",
        text: `Berhasil Update HPP ${payload.product_name}`,
        icon: "success",
      });

      if (callFetchAfterUpdate) {
        callFetchAfterUpdate()
      }
      onClose()
      resetFormData()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Terdapat Kesalahan Saat Mengambil Data, Silahkan Coba Kembali`,
        icon: "error",
      });
      resetFormData()
    }
  };

  const handleChangeField = (e) => {
    const { name, value } = e.target;

    if (name === 'product_name') {
      const selectedProduct = products.find((p) => p.product_name === value);
      setFormData((prevData) => ({
        ...prevData,
        product_name: value,
        hpp: selectedProduct ? selectedProduct.hpp : 0,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black/30 flex justify-center items-center z-50'>
      <div className='bg-white overflow-auto p-8 rounded-2xl shadow-lg w-full max-h-10/12 max-w-lg flex flex-col gap-6'>
        <span className='font-bold text-2xl text-amber-800 text-center'>Edit HPP Product</span>
        <form onSubmit={handleSubmitForm} className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Nama Produk</label>
            <select
              name='product_name'
              value={formData.product_name}
              onChange={handleChangeField}
              required
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            >
              <option value="">Pilih Nama Produk</option>
              {products.map((product, index) => (
                <option key={index} value={product.product_name}>
                  {product.product_name}
                </option>
              ))}
            </select>

            </div>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>HPP</label>
            <input
              type='number'
              name='hpp'
              value={formData.hpp}
              onChange={handleChangeField}              
              onFocus={(e) => e.target.select()} 
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex justify-end gap-3 mt-4'>
            <button
              type='button'
              onClick={handleCancel}
              className='px-6 py-3 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-200 ease-in'
            >
              Batal
            </button>
            <button
              type='submit'
              className='px-6 py-3 rounded-full font-bold text-white bg-orange-400 hover:bg-orange-500 transition duration-200 ease-in shadow-md'
            >
              Simpan
            </button>
          </div>
        </form>

      </div>
    </div>

    
  );
}
