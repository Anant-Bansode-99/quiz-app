import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Award, Target, Home, Check, X, Trophy } from 'lucide-react';
import { getResultDetails } from '../services/api';
import './Results.css';

const Results = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const score = location.state?.score || details?.result?.score || 0;
    const total = location.state?.total || details?.result?.total_questions || 0;
    const time_taken = location.state?.time_taken || details?.result?.time_taken || 0;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getResultDetails(id);
                setDetails(data);
            } catch (err) {
                console.error("Failed to fetch detailed results", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    let message = "";
    let glowColor = "";
    if (percentage >= 90) { message = "Outstanding! You are a master."; glowColor = "rgba(16, 185, 129, 0.5)"; }
    else if (percentage >= 70) { message = "Great job! Very well done."; glowColor = "rgba(59, 130, 246, 0.5)"; }
    else if (percentage >= 50) { message = "Good effort. Room for improvement."; glowColor = "rgba(245, 158, 11, 0.5)"; }
    else { message = "Keep practicing! You'll get there."; glowColor = "rgba(239, 68, 68, 0.5)"; }

    return (
        <div className="results-container animate-fade-in">
            <div className="results-card glass-panel" style={{ "--card-glow": glowColor }}>
                <div className="results-icon">
                    <Award size={48} />
                </div>

                <h1 className="results-title">Quiz Completed!</h1>
                <p className="results-message">{message}</p>

                <div className="score-circle">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                        <path
                            className="circle-bg"
                            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className="circle"
                            strokeDasharray={`${percentage}, 100`}
                            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">{percentage}%</text>
                    </svg>
                </div>

                <div className="stats-row">
                    <div className="stat-pill glass-panel">
                        <Target size={18} className="text-primary" />
                        <span>Score: {score} out of {total}</span>
                    </div>
                    {time_taken > 0 && (
                        <div className="stat-pill glass-panel">
                            <span>⏱️ {time_taken}s</span>
                        </div>
                    )}
                </div>

                <div className="results-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn btn-outline" onClick={() => navigate('/')}>
                        <Home size={18} /> Dashboard
                    </button>
                    {details?.result?.quiz_id && (
                        <button className="btn btn-primary" onClick={() => navigate(`/leaderboard/${details.result.quiz_id}`)}>
                            <Trophy size={18} /> View Leaderboard
                        </button>
                    )}
                </div>

                {!loading && details && (
                    <div className="answers-breakdown">
                        <h3 className="mb-4">Quiz Answers Breakdown</h3>
                        {details.questions.map((q, qIndex) => {
                            const userAnswerObj = details.result.answers.find(a => a.questionId === q.id);
                            const selectedOption = userAnswerObj ? userAnswerObj.selectedOptionIndex : null;
                            const isCorrect = selectedOption === q.correct_answer;

                            return (
                                <div key={q.id} className="answer-card">
                                    <h4>{qIndex + 1}. {q.question_text}</h4>

                                    {q.options.map((opt, optIdx) => {
                                        let optionClass = 'option-neutral';
                                        let Icon = null;

                                        if (optIdx === q.correct_answer) {
                                            optionClass = 'option-correct';
                                            Icon = <Check size={16} className="text-success inline ml-2" />;
                                        } else if (optIdx === selectedOption && selectedOption !== q.correct_answer) {
                                            optionClass = 'option-incorrect';
                                            Icon = <X size={16} className="text-danger inline ml-2" />;
                                        }

                                        return (
                                            <div key={optIdx} className={`answer-option ${optionClass}`}>
                                                {String.fromCharCode(65 + optIdx)}) {opt}
                                                {Icon}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Results;
