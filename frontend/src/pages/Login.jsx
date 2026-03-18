import { useState, useEffect } from 'react';
import { login, googleAuth, setPassword } from '../services/api';
import { User, Lock, ArrowRight, UserPlus } from 'lucide-react';
import './Login.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = ({ onLogin }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Google Auth specific state
    const [needsPassword, setNeedsPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [googleUserData, setGoogleUserData] = useState(null);

    useEffect(() => {
        // Initialize Google Identity Services when component mounts
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback,
            });
            window.google.accounts.id.renderButton(
                document.getElementById('google-signin-btn'),
                { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' }
            );
        }
    }, []); // Initialize once on mount

    const handleGoogleCallback = async (response) => {
        setError('');
        setLoading(true);
        try {
            const data = await googleAuth(response.credential);
            
            if (data.needsPassword) {
                // First time Google user — prompt to set password
                // Save the data temporarily and show the password modal
                setGoogleUserData(data);
                setNeedsPassword(true);
            } else {
                // Existing user — log them in immediately
                onLogin(data);
            }
        } catch (err) {
            setError(err.message || 'Google Auth failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setError('');
        setLoading(true);
        try {
            // First log the user in with the token we got from Google
            localStorage.setItem('token', googleUserData.token);
            
            // Then call the set-password endpoint
            await setPassword(newPassword);
            
            // Now fully log them in
            onLogin(googleUserData);
        } catch (err) {
            setError(err.message || 'Failed to set password');
            localStorage.removeItem('token'); // Cleanup if failed
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(formData.email, formData.password);
            onLogin(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper animate-fade-in">
            <div className="auth-card glass-panel">
                <div className="auth-header">
                    <div className="auth-icon">
                        <UserPlus size={32} color="white" />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Enter your credentials to access your account</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-with-icon">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter email or username"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                        {loading ? 'Processing...' : 'Sign In'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                    
                    <div className="auth-divider">
                        <span>or new users</span>
                    </div>

                    <div id="google-signin-btn" className="google-btn-container"></div>
                </form>
            </div>

            {/* Set Password Modal for first-time Google users */}
            {needsPassword && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel animate-fade-in">
                        <h3>Set a Password</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Since you signed up with Google, please set a password so you can also log in directly using your email later.
                        </p>
                        <form onSubmit={handleSetPasswordSubmit}>
                            <div className="input-group">
                                <label>New Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Enter a strong password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Password & Continue'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Login;
