import React, { useState, useEffect, act } from 'react';
import Swal from 'sweetalert2';


export function ProductModal({ isOpen, onClose, product: editedProduct, onSave, action, callFetchAfterUpdate }) {

  const [formData, setFormData] = useState({
    product_code: "",
    product_name: "",
    colour:"",
    size:"",
    stock: 0,
    price: 0,
    capital_price:0
  })

  useEffect(() => {
    if(editedProduct) {
      setFormData(editedProduct)
    }
  }, [editedProduct])

  const resetFormData = () => {
      setFormData({
        product_code: "",
        product_name: "",
        colour:"",
        size:"",
        stock:0,
        price: 0,
        capital_price: 0
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

    try {
        let payload = formData

        payload.stock = parseInt(payload.stock)
        payload.price = parseInt(payload.price)
        payload.capital_price = parseInt(payload.capital_price)

        let url = ""

        if(action == "EDIT") {
          url = `https://127.0.0.1:3000/product/${editedProduct.id_product}`
          payload.id_product = editedProduct.id_product
        } else if(action == "ADD") {
          url = "https://127.0.0.1:3000/products"
        }

        const response = await fetch(url, {
            method: action == "EDIT" ? "PUT" : "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
        });

        if (response.status != 200 && response.status !== 201) {
            Swal.fire({
                title: "Error",
                text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Add"} Data, Silahkan Coba Kembali`,
                icon: "error",
            });   
            
            return
        }

        Swal.fire({
          title: "Sukses",
          text: `Berhasil ${action == "EDIT" ? 'Edit' : "Add"} Data`,
          icon: "success",
        });  
        if(callFetchAfterUpdate) {
          callFetchAfterUpdate()
        }
        onClose()
    } catch (error) {
      Swal.fire({
          title: "Error",
          text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Add"} Data, Silahkan Coba Kembali`,
          icon: "error",
      });            
    } finally {
      resetFormData()
    }
  };

  const handleChangeField = (e) => {
    const {name, value} = e.target

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
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Stok</label>
            <input
              type='number'
              name='stock'
              defaultValue={formData.stock || editedProduct?.stock || 0}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Harga</label>
            <input
              type='number'
              name='price'
              defaultValue={formData.price || editedProduct?.price || 0}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>HPP</label>
            <input
              type='number'
              name='capital_price'
              defaultValue={formData.capital_price || editedProduct?.capital_price || 0}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>
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
  const [formData, setFormData] = useState({
    id_product: null,
    product_code: "",
    product_name: "",
    colour: "",
    size: "",
    qty: action == "SCAN" ? 1 : 0,
    discount: 0,
    admin_fee: 0,
    remark: ""
  })
 
  useEffect(() => {
    if(editedTransaction) {
      setFormData({...formData, ...editedTransaction})
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
        admin_fee: 0,
        remark: ""
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

    try {
        let payload = formData

        payload.qty = parseInt(payload.qty)
        payload.discount = parseInt(payload.discount)
        payload.admin_fee = parseInt(payload.admin_fee)

        let url = ""

        if(action == "EDIT") {
          url = `https://127.0.0.1:3000/transaction/${editedTransaction.id_transaction}`
          payload.id_transaction = parseInt(editedTransaction.id_transaction)
        } else {
          if(action == "SCAN") {
            payload.id_product = parseInt(editedTransaction.id_product)
          }
          url = "https://127.0.0.1:3000/transactions"
        }

        const response = await fetch(url, {
            method: action == "EDIT" ? "PUT" : "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
        });

        if (response.status != 200 && response.status !== 201) {
            Swal.fire({
                title: "Error",
                text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Add"} Data, Silahkan Coba Kembali`,
                icon: "error",
            });       
            
            return
        }

        Swal.fire({
          title: "Sukses",
          text: `Berhasil ${action == "EDIT" ? 'Edit' : "Add"} Data`,
          icon: "success",
        });  

        if(callFetchAfterUpdate) {
          callFetchAfterUpdate()
        }

        onClose()
    } catch (error) {
        Swal.fire({
            title: "Error",
            text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Add"} Data, Silahkan Coba Kembali`,
            icon: "error",
        });            
    } finally {
      resetFormData()
    }
  };

   const handleChangeField = (e) => {
    const {name, value} = e.target

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
        <span className='font-bold text-2xl text-amber-800 text-center'>{action == "EDIT" ? "Edit" : "Tambah"} Transaksi</span>
        <form onSubmit={handleSubmitForm} className='flex flex-col gap-4'>
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

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Qty</label>
            <input
              type='number'
              name='qty'
              defaultValue={formData.qty || editedTransaction?.qty || 0}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>
          
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Diskon</label>
            <input
              type='number'
              name='discount'
              defaultValue={formData.discount || editedTransaction?.discount || 0}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-300'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Biaya Admin</label>
            <input
              type='number'
              name='admin_fee'
              defaultValue={formData.admin_fee || editedTransaction?.admin_fee || 0}
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