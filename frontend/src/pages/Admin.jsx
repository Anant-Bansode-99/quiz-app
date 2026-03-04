import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminQuizzes, createQuiz, deleteQuiz, addQuestion } from '../services/api';
import { PlusCircle, Trash2, Shield, Trophy } from 'lucide-react';
import './Admin.css';

const Admin = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // New Quiz State (Now includes a questions array)
    const [newQuiz, setNewQuiz] = useState({
        title: '',
        description: '',
        time_limit: 0,
        questions: []
    });

    const addDraftQuestion = () => {
        setNewQuiz(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                { question_text: '', options: ['', '', '', ''], correct_answer: 0 }
            ]
        }));
    };

    const updateDraftQuestion = (qIndex, field, value) => {
        setNewQuiz(prev => {
            const updatedList = [...prev.questions];
            updatedList[qIndex] = { ...updatedList[qIndex], [field]: value };
            return { ...prev, questions: updatedList };
        });
    };

    const updateDraftOption = (qIndex, optIndex, value) => {
        setNewQuiz(prev => {
            const updatedList = [...prev.questions];
            const updatedOptions = [...updatedList[qIndex].options];
            updatedOptions[optIndex] = value;
            updatedList[qIndex] = { ...updatedList[qIndex], options: updatedOptions };
            return { ...prev, questions: updatedList };
        });
    };

    const removeDraftQuestion = (qIndex) => {
        setNewQuiz(prev => {
            const updatedList = prev.questions.filter((_, i) => i !== qIndex);
            return { ...prev, questions: updatedList };
        });
    };

    const loadQuizzes = async () => {
        try {
            const q = await getAdminQuizzes();
            setQuizzes(q);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuizzes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateQuiz = async (e) => {
        e.preventDefault();

        // Validation check
        if (newQuiz.questions.length === 0) {
            if (!window.confirm('You are creating a quiz with NO questions. Students cannot take empty quizzes. Continue?')) {
                return;
            }
        }

        try {
            await createQuiz(newQuiz);
            setNewQuiz({ title: '', description: '', time_limit: 0, questions: [] });
            loadQuizzes();
            alert('Quiz created successfully!');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteQuiz = async (id) => {
        if (window.confirm('Are you sure you want to delete this quiz? This will wipe all its questions and student results.')) {
            try {
                await deleteQuiz(id);
                loadQuizzes();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    if (loading) return <div className="loading-spinner">Loading Admin Panel...</div>;

    return (
        <div className="admin-container animate-fade-in">
            <div className="admin-header">
                <h1><Shield className="text-primary mr-2" /> Quiz Adder</h1>
                <p>Build and deploy complete quizzes instantly across the platform.</p>
            </div>

            <div className="admin-grid">
                <div className="admin-card glass-panel">
                    <h2>Quiz Builder</h2>
                    <form onSubmit={handleCreateQuiz} className="admin-form">
                        <div className="input-group">
                            <label>Quiz Title</label>
                            <input
                                type="text"
                                className="input-field"
                                value={newQuiz.title}
                                onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Description</label>
                            <textarea
                                className="input-field"
                                rows="3"
                                value={newQuiz.description}
                                onChange={e => setNewQuiz({ ...newQuiz, description: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Time Limit (minutes, 0 for unlimited)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={newQuiz.time_limit}
                                onChange={e => setNewQuiz({ ...newQuiz, time_limit: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>Quiz Questions ({newQuiz.questions.length})</h3>
                                <button type="button" className="btn btn-outline btn-sm" onClick={addDraftQuestion}>
                                    <PlusCircle size={16} /> Add Question
                                </button>
                            </div>

                            {newQuiz.questions.map((q, qIndex) => (
                                <div key={qIndex} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', marginBottom: '1rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label className="text-sm text-muted">Question #{qIndex + 1}</label>
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDraftQuestion(qIndex)} style={{ padding: '0.2rem 0.5rem' }}>
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="input-field mt-2"
                                        placeholder="What is..."
                                        value={q.question_text}
                                        onChange={e => updateDraftQuestion(qIndex, 'question_text', e.target.value)}
                                        required
                                    />

                                    <div style={{ marginTop: '1rem' }}>
                                        <label className="text-sm text-muted mb-2">Options (Select radio button for correct answer)</label>
                                        {q.options.map((opt, optIndex) => (
                                            <div key={optIndex} className="option-input-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    type="radio"
                                                    name={`correctAnswer-${qIndex}`}
                                                    checked={q.correct_answer === optIndex}
                                                    onChange={() => updateDraftQuestion(qIndex, 'correct_answer', optIndex)}
                                                />
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder={`Option ${optIndex + 1}`}
                                                    value={opt}
                                                    onChange={e => updateDraftOption(qIndex, optIndex, e.target.value)}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="submit" className="btn btn-primary mt-4 full-width" style={{ padding: '1rem', fontSize: '1.1rem' }}>
                            <PlusCircle size={20} /> Save Complete Quiz
                        </button>
                    </form>
                </div>

                <div className="admin-card glass-panel">
                    <h2>Existing Quizzes</h2>
                    <ul className="admin-list mt-2">
                        {quizzes.length === 0 ? (
                            <li className="text-muted">No quizzes created yet.</li>
                        ) : (
                            quizzes.map(q => (
                                <li key={q.id} className="admin-list-item glass-panel" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 'bold' }}>{q.title}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                            {q.question_count} Questions • {q.time_limit}m
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/leaderboard/${q.id}`)}>
                                            <Trophy size={16} /> Leaderboard
                                        </button>
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteQuiz(q.id)}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Admin;
