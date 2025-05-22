import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Redemptions from './pages/Redemptions';
import ShouldIBookIt from './pages/ShouldIBookIt';
import './index.css';
import { Home, List, Calculator } from 'lucide-react';

function NavBar() {
  const location = useLocation();
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { to: '/redemptions', label: 'Redemptions', icon: <List size={20} /> },
    { to: '/should-i-book-it', label: 'Calculator', icon: <Calculator size={20} /> },
  ];
  // Simulate user ID for demo (replace with real if available)
  const userId = '09174971448898728530';
  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-8">
        <span className="text-3xl font-extrabold text-blue-600 tracking-tight">Cents Per Point</span>
        <nav className="flex gap-2">
          {navLinks.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={
                  `flex items-center gap-2 font-semibold px-5 py-2 rounded-xl transition shadow-sm ` +
                  (isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200')
                }
                aria-current={isActive ? 'page' : undefined}
              >
                {link.icon} {link.label}
              </Link>
            );
          })}
        </nav>
        <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 font-mono">User ID: <span className="font-semibold">{userId}</span></span>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <NavBar />
      <div className="min-h-screen bg-platinum-900">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/redemptions" element={<Redemptions />} />
          <Route path="/should-i-book-it" element={<ShouldIBookIt />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
