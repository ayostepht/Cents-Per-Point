import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Redemptions from './pages/Redemptions';
import ShouldIBookIt from './pages/ShouldIBookIt';
import './App.css';

function App() {
  return (
    <Router>
      <nav style={{ padding: 16, borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: 16 }}>Dashboard</Link>
        <Link to="/redemptions" style={{ marginRight: 16 }}>Redemptions</Link>
        <Link to="/should-i-book-it">Should I Book It?</Link>
      </nav>
      <div style={{ padding: 16 }}>
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