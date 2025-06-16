import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Redemptions from './pages/Redemptions';
import ShouldIBookIt from './pages/ShouldIBookIt';
import ImportExport from './pages/ImportExport';
import Trips from './pages/Trips';
import TripDetails from './pages/TripDetails';
import './index.css';
import { Home, List, Calculator, Download, Map } from 'lucide-react';

function NavBar() {
  const location = useLocation();
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { to: '/redemptions', label: 'Redemptions', icon: <List size={20} /> },
    { to: '/trips', label: 'Trips', icon: <Map size={20} /> },
    { to: '/should-i-book-it', label: 'Calculator', icon: <Calculator size={20} /> },
    { to: '/import-export', label: 'Import/Export', icon: <Download size={20} /> },
  ];
  return (
    <header className="w-full bg-white sticky top-0 z-40 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
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
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <NavBar />
      <div className="min-h-screen bg-gray-100 w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/redemptions" element={<Redemptions />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:id" element={<TripDetails />} />
          <Route path="/should-i-book-it" element={<ShouldIBookIt />} />
          <Route path="/import-export" element={<ImportExport />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
