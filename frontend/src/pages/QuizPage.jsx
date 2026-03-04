import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuiz, submitQuiz } from '../services/api';
import { Clock, AlertCircle, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import './QuizPage.css';

const QuizPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [alreadyAttempted, setAlreadyAttempted] = useState(false);
    const [existingResult, setExistingResult] = useState(null);

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]); // Array of { questionId, selectedOptionIndex }
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const [elapsedTime, setElapsedTime] = useState(0); // Tracks actual absolute time taken
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const data = await getQuiz(id);
                if (data.alreadyAttempted) {
                    setAlreadyAttempted(true);
                    setExistingResult(data.existingResult);
                    setQuizData(data);
                } else {
                    setQuizData(data);
                    if (data.quiz.time_limit) {
                        setTimeLeft(data.quiz.time_limit * 60);
                    }
                }
            } catch (err) {
                setError(err.message || 'Failed to load quiz');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    useEffect(() => {
        if (isSubmitting) return;

        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);

            if (timeLeft !== null) {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit(); // Auto submit on timeout
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, isSubmitting, handleSubmit]);

    const handleSelectOption = (questionId, optionIndex) => {
        setAnswers(prev => {
            const existing = prev.findIndex(a => a.questionId === questionId);
            if (existing >= 0) {
                const update = [...prev];
                update[existing] = { questionId, selectedOptionIndex: optionIndex };
                return update;
            }
            return [...prev, { questionId, selectedOptionIndex: optionIndex }];
        });
    };

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await submitQuiz(id, answers, elapsedTime);
            navigate(`/results/${res.resultId}`, { state: { score: res.score, total: res.totalQuestions } });
        } catch (err) {
            alert('Error submitting quiz');
            setIsSubmitting(false);
        }
    }, [id, answers, elapsedTime, isSubmitting, navigate]);

    if (loading) return <div className="loading-spinner">Loading Quiz...</div>;
    if (error) return <div className="error-message"><AlertCircle /> {error}</div>;

    if (alreadyAttempted && quizData) {
        return (
            <div className="quiz-container animate-fade-in">
                <div className="question-card glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <CheckCircle size={64} style={{ color: 'var(--success, #22c55e)', marginBottom: '1.5rem' }} />
                    <h2 style={{ marginBottom: '0.75rem' }}>Quiz Already Completed</h2>
                    <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
                        You have already attempted <strong>{quizData.quiz.title}</strong>.<br />
                        Each quiz can only be taken once.
                    </p>
                    {existingResult && (
                        <div className="quiz-timer" style={{ display: 'inline-flex', marginBottom: '2rem', fontSize: '1.25rem' }}>
                            Your Score: {existingResult.score} / {existingResult.total_questions}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="btn btn-outline" onClick={() => navigate('/')}>Back to Quizzes</button>
                        <button className="btn btn-primary" onClick={() => navigate('/history')}>View History</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!quizData || !quizData.questions.length) return <div className="error-message">No questions available for this quiz.</div>;

    const { quiz, questions } = quizData;
    const q = questions[currentQuestion];
    const currentAnswer = answers.find(a => a.questionId === q.id)?.selectedOptionIndex;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="quiz-container animate-fade-in">
            <div className="quiz-header glass-panel">
                <div>
                    <h2 className="quiz-title">{quiz.title}</h2>
                    <div className="quiz-progress-text">Question {currentQuestion + 1} of {questions.length}</div>
                </div>

                {timeLeft !== null && (
                    <div className={`quiz-timer ${timeLeft < 60 ? 'timer-danger' : ''}`}>
                        <Clock size={20} />
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            <div className="quiz-progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            <div className="question-card glass-panel">
                <h3 className="question-text">{q.question_text}</h3>

                <div className="options-list">
                    {q.options.map((opt, idx) => {
                        const isSelected = currentAnswer === idx;
                        return (
                            <div
                                key={`${q.id}-${idx}`}
                                className={`option-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelectOption(q.id, idx)}
                            >
                                <div className="option-marker">{String.fromCharCode(65 + idx)}</div>
                                <div className="option-text">{opt}</div>
                                {isSelected && <CheckCircle size={20} className="select-icon" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="quiz-footer">
                <button
                    className="btn btn-outline"
                    onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))}
                    disabled={currentQuestion === 0}
                >
                    <ArrowLeft size={18} /> Previous
                </button>

                {currentQuestion < questions.length - 1 ? (
                    <button
                        className="btn btn-primary"
                        onClick={() => setCurrentQuestion(p => Math.min(questions.length - 1, p + 1))}
                    >
                        Next Question <ArrowRight size={18} />
                    </button>
                ) : (
                    <button
                        className="btn btn-success"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <CheckCircle size={18} /> {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizPage;
