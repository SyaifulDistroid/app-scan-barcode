import React, { useState, useEffect, act } from 'react';
import Swal from 'sweetalert2';


export function ProductModal({ isOpen, onClose, product: editedProduct, onSave, action, callFetchAfterUpdate }) {

  const [formData, setFormData] = useState({
    product_code: "",
    product_name: "",
    colour:"",
    size:"",
    stock: 0,
    price: 0
  })

  useEffect(() => {
    if(editedProduct) {
      setFormData(editedProduct)
    }
  }, [editedProduct])

  useEffect(() => {
    if(!isOpen) {
      setFormData({
        product_code: "",
        product_name: "",
        colour:"",
        size:"",
        stock:0,
        price: 0
      })
    }
  }, [isOpen])

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

        let url = ""

        if(action == "EDIT") {
          url = `http://127.0.0.1:3000/product/${editedProduct.id_product}`
          payload.id_product = editedProduct.id_product
        } else if(action == "ADD") {
          url = "http://127.0.0.1:3000/products"
        }

        const response = await fetch(url, {
            method: action == "EDIT" ? "PUT" : "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            Swal.fire({
                title: "Error",
                text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Add"} Data, Silahkan Coba Kembali`,
                icon: "error",
            });            
        }

        Swal.fire({
          title: "Sukses",
          text: `Berhasil ${action == "EDIT" ? 'Edit' : "Add"} Data`,
          icon: "success",
        });  
        callFetchAfterUpdate()

        onClose()
    } catch (error) {
      console.log(error)
        Swal.fire({
            title: "Error",
            text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Add"} Data, Silahkan Coba Kembali`,
            icon: "error",
        });            
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
        <button onClick={() => console.log(formData)}>consol</button>
        <form onSubmit={handleSubmitForm} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Kode Produk</label>
            <input
              type='text'
              name='product_code'
              defaultValue={formData.product_code}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>
          
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Nama Produk</label>
            <input
              type='text'
              name='product_name'
              defaultValue={formData.product_name}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Warna</label>
            <input
              type='text'
              name='colour'
              defaultValue={formData.colour}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Ukuran</label>
            <input
              type='text'
              name='size'
              defaultValue={formData.size}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Stok</label>
            <input
              type='number'
              name='stock'
              defaultValue={formData.stock || editedProduct?.stock || ""}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Harga</label>
            <input
              type='number'
              name='price'
              defaultValue={formData.price || editedProduct?.price || ""}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>
          <div className='flex justify-end gap-3 mt-4'>
            <button
              onClick={onClose}
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
    product_code: "",
    product_name: "",
    colour: "",
    size: "",
    qty: 0,
    discount: 0,
    admin_fee: 0,
    remark: ""
  })

  
  useEffect(() => {
    if(editedTransaction) {
      setFormData(editedTransaction)
    }
  }, [editedTransaction])

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
          url = `http://127.0.0.1:3000/transaction/${editedProduct.id_product}`
          payload.id_product = editedProduct.id_product
        } else if(action == "ADD") {
          url = "http://127.0.0.1:3000/transactions"
        }

        const response = await fetch(url, {
            method: action == "EDIT" ? "PUT" : "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            Swal.fire({
                title: "Error",
                text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Add"} Data, Silahkan Coba Kembali`,
                icon: "error",
            });            
        }

        Swal.fire({
          title: "Sukses",
          text: `Berhasil ${action == "EDIT" ? 'Edit' : "Add"} Data`,
          icon: "success",
        });  
        callFetchAfterUpdate()

        onClose()
    } catch (error) {
      console.log(error)
        Swal.fire({
            title: "Error",
            text: `Terdapat Kesalahan Saat ${action == "EDIT" ? 'Edit' : "Add"} Data, Silahkan Coba Kembali`,
            icon: "error",
        });            
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
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Nama Produk</label>
            <input
              type='text'
              name='product_name'
              defaultValue={formData.product_name}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Warna</label>
            <input
              type='text'
              name='colour'
              defaultValue={formData.colour}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Ukuran</label>
            <input
              type='text'
              name='size'
              defaultValue={formData.size}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Qty</label>
            <input
              type='number'
              name='qty'
              defaultValue={formData.qty || editedTransaction?.qty || "" }
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>
          
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Diskon</label>
            <input
              type='number'
              name='discount'
              defaultValue={formData.discount || editedTransaction?.discount || ""}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Biaya Admin</label>
            <input
              type='number'
              name='admin_fee'
              defaultValue={formData.admin_fee || editedTransaction?.admin_fee || ""}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Keterangan</label>
            <textarea
              name='remark'
              defaultValue={editedTransaction?.remark || ""}
              onChange={handleChangeField}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            ></textarea>
          </div>
          <div className='flex justify-end gap-3 mt-4'>
            <button
              onClick={onClose}
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