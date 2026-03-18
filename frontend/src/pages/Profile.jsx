import { useState, useEffect } from 'react';
import { getProfile, updateProfile, getUserHistory } from '../services/api';
import { User, Mail, Save, UserCircle, History, Award } from 'lucide-react';
import './Profile.css';

const Profile = ({ user, setUser }) => {
    const [profile, setProfile] = useState({ name: '', email: '', role: '', isGoogleUser: false });
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [historyInfo, setHistoryInfo] = useState({ totalTaken: 0, avgScore: 0 });

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            const [data, history] = await Promise.all([
                getProfile(),
                getUserHistory()
            ]);
            
            setProfile(data);
            setEditName(data.name || '');

            // Calculate history stats
            const totalTaken = history.length;
            const avgScore = totalTaken === 0 ? 0 : 
                Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) / totalTaken);
            
            setHistoryInfo({ totalTaken, avgScore });

        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load profile details.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await updateProfile(editName);
            setProfile({ ...profile, name: result.name });
            
            // Sync with global app state and localStorage
            setUser(prev => ({ ...prev, name: result.name }));
            localStorage.setItem('name', result.name);
            
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
            
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-spinner">Loading Profile...</div>;

    const initials = (profile.name || profile.email || 'U').charAt(0).toUpperCase();

    return (
        <div className="profile-page animate-fade-in">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your account settings and personal information.</p>
            </div>

            <div className="profile-content">
                <div className="profile-card glass-panel">
                    <div className="profile-avatar-container">
                        <div className="profile-avatar">
                            {initials}
                        </div>
                            <div className="profile-badge">
                                {profile.role === 'admin' ? 'Administrator' : 'Student'}
                            </div>
                        </div>

                        {/* Quick Stats Section */}
                        {profile.role !== 'admin' && (
                            <div className="profile-stats">
                                <div className="stat-item">
                                    <div className="stat-icon-small bg-purple">
                                        <History size={18} />
                                    </div>
                                    <div className="stat-details">
                                        <span className="stat-value">{historyInfo.totalTaken}</span>
                                        <span className="stat-label">Quizzes Done</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon-small bg-emerald">
                                        <Award size={18} />
                                    </div>
                                    <div className="stat-details">
                                        <span className="stat-value">{historyInfo.avgScore}%</span>
                                        <span className="stat-label">Avg. Score</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {message.text && (
                            <div className={`profile-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="profile-form">
                        <div className="input-group">
                            <label>Full Name</label>
                            {isEditing ? (
                                <div className="input-with-icon">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Enter your full name"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div className="profile-value">
                                    <User size={18} />
                                    <span>{profile.name || <em>Not set</em>}</span>
                                </div>
                            )}
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>
                            <div className="profile-value disabled-value">
                                <Mail size={18} />
                                <span>{profile.email}</span>
                                {profile.isGoogleUser && (
                                    <span className="google-badge">Google Account</span>
                                )}
                            </div>
                        </div>

                        <div className="profile-actions">
                            {isEditing ? (
                                <>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline" 
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditName(profile.name || '');
                                        }}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
