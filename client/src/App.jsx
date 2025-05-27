import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import './App.css';

import store from './store';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';
import CountryForm from './features/country/administration/CountryForm';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path='/Dashboard' element={<Dashboard />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path='/country-form' element={<CountryForm />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;