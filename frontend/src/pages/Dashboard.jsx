import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuizzes, getUserHistory, getAdminQuizzes, getAdminStats, getAllResults } from '../services/api';
import { Play, Clock, Award, History, BookOpen, Trophy } from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [adminMetrics, setAdminMetrics] = useState({ totalTaken: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === 'admin') {
          const [adminData, adminStats, globalResults] = await Promise.all([
            getAdminQuizzes(),
            getAdminStats(),
            getAllResults()
          ]);
          setQuizzes(adminData);
          setHistory(globalResults); // Use global results for Admin Recent Activity
          setAdminMetrics(adminStats);
        } else {
          const [quizzesData, historyData] = await Promise.all([
            getQuizzes(),
            getUserHistory()
          ]);
          setQuizzes(quizzesData);
          setHistory(historyData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.role]);

  // If Admin, compute stats differently if needed, but per requirements user wants to see Quizzes Completed & Avg.
  // Because "Quizzes Completed" relates directly to User History, an Admin account itself won't have personal taking history.
  // Let's compute these variables:
  const totalTaken = user.role === 'admin' ? adminMetrics.totalTaken : history.length;
  const avgScore = user.role === 'admin' ? adminMetrics.avgScore : (totalTaken === 0 ? 0 :
    Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) / totalTaken));

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        {user.role === 'admin' ? (
          <>
            <h1>Home Page</h1>
            <p>Welcome back, {user.email}. Monitor your global Quiz platform.</p>
          </>
        ) : (
          <>
            <h1>Welcome back, {user.email}!</h1>
            <p>Ready to test your knowledge today?</p>
          </>
        )}
      </div>

      <div className="stats-container">
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-cyan"><BookOpen size={24} /></div>
          <div>
            <h3>{quizzes.length}</h3>
            <p>Available Quizzes</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-purple"><History size={24} /></div>
          <div>
            <h3>{totalTaken}</h3>
            <p>Quizzes Completed</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-emerald"><Award size={24} /></div>
          <div>
            <h3>{avgScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {user.role !== 'admin' && (
          <div className="quizzes-section">
            <h2>Available Quizzes</h2>
            <div className="quiz-grid">
              {quizzes.length === 0 ? (
                <p className="empty-state">No quizzes available right now.</p>
              ) : (
                quizzes.map(quiz => (
                  <div key={quiz.id} className="quiz-card glass-panel">
                    <h3>{quiz.title}</h3>
                    <p className="quiz-desc">{quiz.description}</p>
                    <div className="quiz-meta">
                      <Clock size={16} />
                      <span>{quiz.time_limit ? `${quiz.time_limit} mins` : 'No time limit'}</span>
                      <span style={{ marginLeft: '1rem', color: '#94a3b8' }}>
                        • {quiz.question_count || 0} Questions
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                        disabled={!quiz.question_count || quiz.question_count === 0}
                        title={(!quiz.question_count || quiz.question_count === 0) ? "This quiz has no questions yet" : ""}
                      >
                        <Play size={16} /> Start
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ flex: 1 }}
                        onClick={() => navigate(`/leaderboard/${quiz.id}`)}
                      >
                        <Trophy size={16} /> Leaderboard
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="history-section" style={user.role === 'admin' ? { width: '100%' } : {}}>
          <h2>Recent Activity</h2>
          <div className="history-list glass-panel">
            {history.length === 0 ? (
              <p className="empty-state" style={{ padding: '2rem' }}>
                {user.role === 'admin' ? "No students have taken your quizzes yet." : "You haven't taken any quizzes yet."}
              </p>
            ) : (
              history.slice(0, 15).map(record => (
                <div key={record.id} className="history-item">
                  <div className="history-info">
                    <h4 style={{ marginBottom: '0.35rem' }}>{record.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {record.username && (
                        <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          👤 {record.username}
                        </span>
                      )}
                      <span className="history-date" style={{ margin: 0 }}>
                        📅 {new Date(record.created_at).toLocaleDateString()}
                        {' · '}{record.time_taken}s
                      </span>
                    </div>
                  </div>
                  <div className="history-score">
                    <div className="score-badge">
                      {record.score} / {record.total_questions}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
