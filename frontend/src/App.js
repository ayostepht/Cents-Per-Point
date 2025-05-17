import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Redemptions from './pages/History';
import './App.css';

function App() {
  return (
    <Router>
      <nav style={{ padding: 16, borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: 16 }}>Dashboard</Link>
        <Link to="/redemptions">Redemptions</Link>
      </nav>
      <div style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/redemptions" element={<Redemptions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 