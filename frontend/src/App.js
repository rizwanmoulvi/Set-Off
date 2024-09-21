import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import MarketPlace from './pages/MarketPlace';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/marketplace' element={<MarketPlace />} />
        <Route path='/dashboard/:userAddress' element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
