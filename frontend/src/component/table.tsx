import React, { useState } from 'react';
import Select from 'react-select';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const sizePerPageOptions = [
  {
    label: "10",
    value: 10
  },{
    label: "25",
    value: 25
  },{
    label: "50",
    value: 50
  },{
    label: "100",
    value: 100
  }
]

export default function Table({ data, columns, onPageChange, handleChangeSizePerPage }) {
  const [selectedSizePerPage, setSelectedSizePerPage] = useState({
    label: "10",
    value: 10
  })

  const { items, page, limit, total } = data;

  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;

  // --- Logika Paginasi Baru ---
  const generatePages = () => {
    const pagesToShow = new Set();
    const maxVisiblePages = 5; // Jumlah maksimum halaman yang terlihat

    // Tambahkan halaman pertama dan terakhir
    if (totalPages > 0) {
      pagesToShow.add(1);
      pagesToShow.add(totalPages);
    }

    // Tambahkan halaman-halaman di sekitar halaman aktif
    for (let i = page - 1; i <= page + 1; i++) {
      if (i > 1 && i < totalPages) {
        pagesToShow.add(i);
      }
    }

    // Pastikan halaman awal dan akhir juga terlihat jika dekat dengan halaman aktif
    if (page < 4) {
      for (let i = 2; i <= Math.min(totalPages, maxVisiblePages - 2); i++) {
        pagesToShow.add(i);
      }
    }
    if (page > totalPages - 3) {
      for (let i = totalPages - 1; i >= Math.max(1, totalPages - maxVisiblePages + 3); i--) {
        pagesToShow.add(i);
      }
    }


    // Urutkan halaman-halaman yang akan ditampilkan
    const sortedPages = [...pagesToShow].sort((a, b) => a - b);

    // Tambahkan elipsis (...)
    const finalPages = [];
    for (let i = 0; i < sortedPages.length; i++) {
      finalPages.push(sortedPages[i]);
      if (i < sortedPages.length - 1 && sortedPages[i + 1] - sortedPages[i] > 1) {
        finalPages.push('...');
      }
    }

    return finalPages;
  };

  const pages = generatePages();

  const onChangeSizePerPage = (value) => {
    setSelectedSizePerPage(value)
    handleChangeSizePerPage(value.value)
  }

  return (
    <div className='w-full flex flex-col gap-4'>
      <div className='w-full overflow-x-auto rounded-2xl bg-white shadow-md'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-yellow-200'>
            <tr className='text-center'>
              <th scope='col' className='p-5 font-bold text-gray-500 uppercase tracking-wider'>
                No.
              </th>
              {columns.map((column, index) => (
                <th key={index} scope='col' className='p-5 font-bold text-gray-500 uppercase tracking-wider'>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {items.map((item, index) => (
              <tr
                key={index}
                className={`${(index + 1) % 2 === 0 ? 'bg-orange-50' : ''} hover:bg-orange-100 ease-in duration-100 text-center`}
              >
                <td className='p-5 text-sm text-gray-500'>{startIndex + index + 1}</td>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className='p-5 text-sm font-medium text-gray-900'>
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      {(
        <div className='flex justify-between items-center gap-2'>
          <div>
            <Select 
            styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  border: "1px solid orange",
                  ":focus": {
                    border: "2px solid orange"
                  },
                  borderRadius: "12px"
                })}}
            className='border-orange-400' 
            value={selectedSizePerPage} 
            onChange={(value) => onChangeSizePerPage(value)}
            options={sizePerPageOptions} />
          </div>
          <div className='flex gap-2'>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className={`px-4 py-2 rounded-full font-bold ${page === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-400 text-white hover:bg-orange-500'
                } transition duration-200 ease-in`}
            >
              Previous
            </button>
            {pages.map((pageItem, i) =>
              pageItem === '...' ? (
                <span key={`ellipsis-${i}`} className='px-2 py-2 text-gray-700'>
                  ...
                </span>
              ) : (
                <button
                  key={i}
                  onClick={() => onPageChange(pageItem)}
                  className={`w-10 h-10 rounded-full font-bold ${page === pageItem ? 'bg-orange-400 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                    } transition duration-200 ease-in shadow-md`}
                >
                  {pageItem}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className={`px-4 py-2 rounded-full font-bold ${page === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-400 text-white hover:bg-orange-500'
                } transition duration-200 ease-in`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}