import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, UserCircle, Settings } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar glass-panel">
            <div className="nav-brand">
                <div className="logo-icon">Q</div>
                <span className="logo-text">QuizPro</span>
            </div>
            <div className="nav-links">
                <Link to="/" className={`nav-link ${isActive('/')}`}>
                    <Home size={18} /> Dashboard
                </Link>
                {user.role === 'admin' && (
                    <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
                        <Settings size={18} /> Admin Panel
                    </Link>
                )}
            </div>
            <div className="nav-user">
                <div className="user-info">
                    <UserCircle size={20} />
                    <span>{user.email}</span>
                </div>
                <button className="btn btn-outline nav-logout" onClick={onLogout}>
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
