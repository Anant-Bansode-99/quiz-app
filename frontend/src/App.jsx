import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuizPage from './pages/QuizPage';
import Results from './pages/Results';
import Admin from './pages/Admin';
import AllResults from './pages/AllResults';
import QuizLeaderboard from './pages/QuizLeaderboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    if (token) {
      setUser({ token, role, email });
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('email', userData.username); // Backend still sends 'username' due to DB schema
    setUser({ ...userData, email: userData.username }); // Map it over in React state
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  if (loading) return null;

  return (
    <>
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <div className="container animate-fade-in">
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/quiz/:id" element={user && user.role !== 'admin' ? <QuizPage /> : <Navigate to="/login" />} />
          <Route path="/results/:id" element={user ? <Results /> : <Navigate to="/login" />} />
          <Route path="/leaderboard/:id" element={user ? <QuizLeaderboard /> : <Navigate to="/login" />} />
          <Route path="/history" element={user ? <AllResults user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
