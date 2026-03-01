import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizLeaderboard } from '../services/api';
import { Trophy, ArrowLeft, Clock, Medal } from 'lucide-react';
import './Dashboard.css';

const QuizLeaderboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await getQuizLeaderboard(id);
                setLeaderboard(data);
            } catch (err) {
                console.error("Failed to load leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [id]);

    if (loading) return <div className="loading-spinner">Loading Leaderboard...</div>;

    const quizTitle = leaderboard.length > 0 ? leaderboard[0].title : "Quiz Leaderboard";

    return (
        <div className="dashboard animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ textAlign: 'left' }}>
                    <h1 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy className="text-primary" />
                        {quizTitle} Rankings
                    </h1>
                    <p style={{ margin: 0 }}>Top performers sorted by Score and Time</p>
                </div>
            </div>

            <div className="history-list glass-panel" style={{ padding: '2rem' }}>
                {leaderboard.length === 0 ? (
                    <p className="empty-state">No one has taken this quiz yet. Be the first!</p>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Rank</th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Student</th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Score</th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Options</th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Time Taken</th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((r, index) => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                            {index === 0 && <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Medal size={18} /> 1</span>}
                                            {index === 1 && <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Medal size={18} /> 2</span>}
                                            {index === 2 && <span style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Medal size={18} /> 3</span>}
                                            {index > 2 && <span style={{ color: '#64748b', paddingLeft: '0.5rem' }}>{index + 1}</span>}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#fff' }}>{r.username}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>
                                                {r.score} / {r.total_questions}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                                {Math.round((r.score / r.total_questions) * 100)}%
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={14} className="text-muted" />
                                            {r.time_taken}s
                                        </td>
                                        <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizLeaderboard;
