import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserHistory } from '../services/api';
import { History, ArrowLeft, Award, Clock } from 'lucide-react';
import './Dashboard.css'; // Reuse dashboard styles for cards

const AllResults = ({ user }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getUserHistory();
                setHistory(data);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="loading-spinner">Loading History...</div>;

    return (
        <div className="dashboard animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button className="btn btn-outline" onClick={() => navigate('/')} style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ textAlign: 'left' }}>
                    <h1 style={{ marginBottom: '0.25rem' }}>{user.role === 'admin' ? 'Admin Taking History' : 'My Full History'}</h1>
                    <p style={{ margin: 0 }}>Review all your past quiz attempts</p>
                </div>
            </div>

            <div className="history-list glass-panel" style={{ padding: '2rem' }}>
                {history.length === 0 ? (
                    <p className="empty-state">No quiz history found.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history.map(record => {
                            const percentage = record.total_questions > 0
                                ? Math.round((record.score / record.total_questions) * 100)
                                : 0;

                            return (
                                <div key={record.id} className="history-item glass-panel" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => navigate(`/results/${record.id}`, { state: { score: record.score, total: record.total_questions, time_taken: record.time_taken } })}>
                                    <div className="history-info">
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#fff' }}>{record.title}</h3>
                                        <div style={{ display: 'flex', gap: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <History size={14} />
                                                {new Date(record.created_at).toLocaleDateString()}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} />
                                                {record.time_taken}s elapsed
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444' }}>
                                                {percentage}%
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                {record.score} / {record.total_questions} pts
                                            </span>
                                        </div>
                                        <div style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', padding: '0.5rem', borderRadius: '50%', color: 'white' }}>
                                            <Award size={20} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllResults;
