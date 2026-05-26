import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Leases from './pages/Leases';
import Profile from './pages/Profile';
import Landing from './pages/Landing';

// Protect private routes
// eslint-disable-next-line react/prop-types
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page container">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page container">Starting EscrowChain...</div>;

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/properties" element={<PrivateRoute><Properties /></PrivateRoute>} />
          <Route path="/leases" element={<PrivateRoute><Leases /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
