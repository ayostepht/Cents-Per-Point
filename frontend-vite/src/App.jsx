import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Redemptions from './pages/Redemptions';
import ShouldIBookIt from './pages/ShouldIBookIt';
import './index.css';

function NavBar() {
  const location = useLocation();
  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/redemptions', label: 'Redemptions' },
    { to: '/should-i-book-it', label: 'Should I Book It?' },
  ];
  return (
    <nav className="sticky top-0 z-20 w-full bg-platinum-700 shadow border-b border-platinum-400">
      <div className="max-w-7xl mx-auto px-4 py-3 flex gap-8 items-center">
        <span className="text-2xl font-bold text-oxford-blue-500 tracking-tight">Cost Per Point</span>
        {navLinks.map(link => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={
                `font-semibold px-2 py-1 rounded transition ` +
                (isActive
                  ? 'text-orange-web-700 bg-orange-web-100 underline underline-offset-4'
                  : 'text-oxford-blue-700 hover:text-orange-web-500 hover:bg-orange-web-50')
              }
              aria-current={isActive ? 'page' : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
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
