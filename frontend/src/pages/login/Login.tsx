import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    // Di sini kamu bisa tambahkan logika otentikasi (misal: cek username & password)
    // Untuk contoh ini, kita langsung navigasi ke halaman admin jika berhasil.
    console.log('Username:', username);
    console.log('Password:', password);
    navigate('/admin');
  };

  return (
    <div className='w-full h-screen flex flex-col justify-center items-center bg-gray-100'>
      <div className='w-full max-w-sm rounded-2xl px-8 py-8 bg-white shadow-md flex flex-col gap-6'>
        <span className='font-bold text-3xl text-amber-800 text-center'>Login</span>
        
        <form onSubmit={handleLogin} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Username</label>
            <input 
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
              placeholder='Masukkan username'
              required
            />
          </div>
          
          <div className='flex flex-col gap-2'>
            <label className='font-bold text-gray-700'>Password</label>
            <input 
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
              placeholder='Masukkan password'
              required
            />
          </div>
          
          <button 
            type='submit' 
            className='w-full hover:bg-orange-500 duration-100 ease-in font-bold text-white text-center bg-orange-400 px-7 py-3 rounded-xl shadow-md mt-2'
          >
            Login
          </button>
        </form>
      </div>
      
      <span className='text-gray-700 text-center py-5'>© Ocik Gallery 2025</span>
    </div>
  );
}