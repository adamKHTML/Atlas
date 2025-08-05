
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import './App.css';
import store from './store';
import { useCheckAuthQuery } from './api/endpoints/auth';
import { setUser, clearUser, setLoading } from './store/slices/authSlice';
// Pages
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
import CreateTopicForm from './features/country/topic/CreateTopicForm';
import TopicView from './components/TopicView';
import NotificationPage from './pages/NotificationPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import CountriesListPage from './pages/CountriesListPage';
import MyTopicsPage from './pages/MyTopicsPage';

// 🔒 Composant interne pour vérifier l'auth avec cookies
const AuthChecker = ({ children }) => {
  const dispatch = useDispatch();
  const { data: user, isLoading, error } = useCheckAuthQuery();

  useEffect(() => {
    dispatch(setLoading(isLoading));

    if (user) {
      dispatch(setUser(user));
    } else if (error && error.status === 401) {
      dispatch(clearUser());
    }
  }, [user, isLoading, error, dispatch]);

  return children;
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        {/* 🔒 ENTOURER vos Routes avec AuthChecker */}
        <AuthChecker>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path='/Dashboard' element={<Dashboard />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path='/countries' element={<CountriesListPage />} />
            <Route path='/country-form' element={<CountryForm />} />
            <Route path='/country-content/:countryId' element={<CountryContent />} />

            {/* ROUTES PAYS */}
            <Route path='/country/:countryId' element={<CountryPage />} />
            <Route path="/country-edit/:countryId" element={<CountryEdit />} />

            {/*  ROUTES FORUM  */}
            <Route path="/country/:countryId/discussions" element={<CountryForum />} />
            <Route path="/country/:countryId/discussions/create-topic" element={<CreateTopicForm />} />

            {/* ROUTE VUE TOPIC  */}
            <Route path="/topic/:topicId" element={<TopicView />} />
            {/* ROUTE NOTIFICATION - MESSAGE PRIVEE */}
            <Route path="/notifications" element={<NotificationPage />} />
            {/* ROUTE GESTION UTILISATEURS */}
            <Route path="/user-management" element={<UserManagementPage />} />
            {/*   ROUTE PROFIL */}
            <Route path="/profile" element={<ProfilePage />} />
            {/*   ROUTE MES TOPICS */}
            <Route path="/my-topics" element={<MyTopicsPage />} />
            {/*  ROUTE ANALYTICS  */}
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </AuthChecker>
      </Router>
    </Provider>
  );
}

export default App;