import React, { useState } from 'react';



const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Table({ data, columns, itemsPerPage = 3 }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Logic for pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className='w-full overflow-x-auto flex flex-col gap-4'>
      <div className='w-full rounded-2xl bg-white shadow-md'>
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
            {currentItems.map((item, index) => (
              <tr
                key={item.id_product || index}
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
      {totalPages > 1 && (
        <div className='flex justify-end items-center gap-2'>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-full font-bold ${
              currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-400 text-white hover:bg-orange-500'
            } transition duration-200 ease-in`}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`w-10 h-10 rounded-full font-bold ${
                currentPage === i + 1 ? 'bg-orange-400 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              } transition duration-200 ease-in shadow-md`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-full font-bold ${
              currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-400 text-white hover:bg-orange-500'
            } transition duration-200 ease-in`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}