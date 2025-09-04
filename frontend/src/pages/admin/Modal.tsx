import React, { useState, useEffect } from 'react';


export function ProductModal({ isOpen, onClose, product: editedProduct, onSave, action }) {

//   useEffect(() => {
//     setEditedProduct(product);
//   }, [product]);

  const handleChange = (e) => {
    // setEditedProduct(prev => ({
    //   ...prev,
    //   [name]: value
    // }));
  };

  const handleSave = () => {
    onSave(editedProduct);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black/30 flex justify-center items-center z-50'>
      <div className='bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg flex flex-col gap-6'>
        <span className='font-bold text-2xl text-amber-800 text-center'>{action == "EDIT" ? "Edit" : "Tambah"} Produk</span>

        <form className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Kode Produk</label>
            <input
              type='text'
              name='product_code'
              defaultValue={editedProduct?.product_code || ""}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>
          
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Nama Produk</label>
            <input
              type='text'
              name='product_name'
              defaultValue={editedProduct?.product_name || ""}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Warna</label>
            <input
              type='text'
              name='colour'
              defaultValue={editedProduct?.colour || ""}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Ukuran</label>
            <input
              type='text'
              name='size'
              defaultValue={editedProduct?.size || ""}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Stok</label>
            <input
              type='number'
              name='stock'
              defaultValue={editedProduct?.stock || ""}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Harga</label>
            <input
              type='number'
              name='price'
              defaultValue={editedProduct?.price || ""}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>
        </form>

        <div className='flex justify-end gap-3 mt-4'>
          <button
            onClick={onClose}
            className='px-6 py-3 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-200 ease-in'
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className='px-6 py-3 rounded-full font-bold text-white bg-orange-400 hover:bg-orange-500 transition duration-200 ease-in shadow-md'
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

export function TransactionModal({ isOpen, onClose, transaction: editedTransaction, onSave, action }) {
  // Menggunakan state untuk menyimpan data transaksi yang akan diedit
  // Ini penting agar input form bisa diubah

  // useEffect untuk sinkronisasi state lokal dengan props dari parent
  // Ini memastikan modal menampilkan data yang benar saat dibuka
  useEffect(() => {
    // setEditedTransaction(transaction);
  }, [editedTransaction]);

  const handleChange = (e) => {
    // const { name, value } = e.target;
    // setEditedTransaction(prev => ({
    //   ...prev,
    //   [name]: value
    // }));
  };

  const handleSave = () => {
    onSave(editedTransaction);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black/30 flex justify-center items-center z-50'>
      <div className='bg-white overflow-auto p-8 rounded-2xl shadow-lg w-full max-h-10/12 max-w-lg flex flex-col gap-6'>
        <span className='font-bold text-2xl text-amber-800 text-center'>{action == "EDIT" ? "Edit" : "Tambah"} Transaksi</span>

        <form className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Kode Produk</label>
            <input
              type='text'
              name='product_code'
              defaultValue={editedTransaction?.product_code || ""}
              onChange={handleChange}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Nama Produk</label>
            <input
              type='text'
              name='product_name'
              defaultValue={editedTransaction?.product_name || ""}
              onChange={handleChange}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Warna</label>
            <input
              type='text'
              name='colour'
              defaultValue={editedTransaction?.colour || ""}
              onChange={handleChange}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Ukuran</label>
            <input
              type='text'
              name='size'
              defaultValue={editedTransaction?.size || ""}
              onChange={handleChange}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Qty</label>
            <input
              type='number'
              name='stock'
              defaultValue={editedTransaction?.qty || ""}
              onChange={handleChange}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>
          
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Diskon</label>
            <input
              type='number'
              name='discount'
              defaultValue={editedTransaction?.discount || ""}
              onChange={handleChange}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Biaya Admin</label>
            <input
              type='number'
              name='admin_fee'
              defaultValue={editedTransaction?.admin_fee || ""}
              onChange={handleChange}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Keterangan</label>
            <textarea
              name='remark'
              defaultValue={editedTransaction?.remark || ""}
              onChange={handleChange}
              className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
            ></textarea>
          </div>
        </form>

        <div className='flex justify-end gap-3 mt-4'>
          <button
            onClick={onClose}
            className='px-6 py-3 rounded-full font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-200 ease-in'
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className='px-6 py-3 rounded-full font-bold text-white bg-orange-400 hover:bg-orange-500 transition duration-200 ease-in shadow-md'
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}