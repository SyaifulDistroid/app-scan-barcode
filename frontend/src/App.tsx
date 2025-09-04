import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import AdminPage from './pages/admin/Admin'
import LoginPage from './pages/login/Login'
import ScanPage from './pages/scan/scan'

function App() {


  return (
    <Router>
      <div className='min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200 px-10 font-sans'>
        <Routes>
          <Route path='/' element={<LoginPage />} />
          <Route path='/admin' element={<AdminPage />} />
          <Route path='/scan' element={<ScanPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
