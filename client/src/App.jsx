// App.jsx - VERSION CORRIGÉE POUR LE FORUM
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
import CountryContent from './features/country/administration/CountryContent';
import CountryPage from './pages/CountryPage';
import CountryEdit from './features/country/administration/CountryEdit';
import CountryForum from './pages/CountryForum';
import CreateTopicForm from './features/country/topic/CreateTopicForm'; // Nouvelle page
import TopicView from './components/TopicView';

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
          <Route path='/country-content/:countryId' element={<CountryContent />} />

          {/* ✅ ROUTES HARMONISÉES pour les pays et forum */}
          <Route path='/country/:countryId' element={<CountryPage />} />
          <Route path="/country-edit/:countryId" element={<CountryEdit />} />

          {/* ✅ ROUTES FORUM avec countryId */}
          <Route path="/country/:countryId/discussions" element={<CountryForum />} />
          <Route path="/country/:countryId/discussions/create-topic" element={<CreateTopicForm />} />

          {/* ✅ ROUTE TOPIC VIEW - topicId au lieu de id */}
          <Route path="/topic/:topicId" element={<TopicView />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;