const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        let errData;
        try {
            errData = await response.json();
        } catch (e) {
            errData = {};
        }
        throw new Error(errData.message || 'API Error');
    }

    return response.json();
};

export const login = (email, password) =>
    fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (email, password, role = 'user', name = '') =>
    fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, role, name }) });

export const googleAuth = (credential) =>
    fetchWithAuth('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });

export const setPassword = (password) =>
    fetchWithAuth('/auth/set-password', { method: 'POST', body: JSON.stringify({ password }) });

export const getQuizzes = () => fetchWithAuth('/quizzes');

export const getQuiz = (id) => fetchWithAuth(`/quizzes/${id}`);

export const submitQuiz = (id, answers, time_taken) =>
    fetchWithAuth(`/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers, time_taken }) });

export const getUserHistory = () => fetchWithAuth('/quizzes/user/history');
export const getResultDetails = (id) => fetchWithAuth(`/quizzes/results/${id}/details`);
export const getQuizLeaderboard = (quizId) => fetchWithAuth(`/quizzes/${quizId}/leaderboard`);

// Admin actions
export const createQuiz = (data) => fetchWithAuth('/admin/quizzes', { method: 'POST', body: JSON.stringify(data) });
export const getAdminQuizzes = () => fetchWithAuth('/admin/quizzes');
export const getAdminStats = () => fetchWithAuth('/admin/stats');
export const getAllResults = () => fetchWithAuth('/admin/results');
export const deleteQuiz = (id) => fetchWithAuth(`/admin/quizzes/${id}`, { method: 'DELETE' });
export const addQuestion = (quizId, data) => fetchWithAuth(`/admin/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify(data) });

export const uploadQuizImage = async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_BASE}/admin/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Upload failed');
    }
    return response.json(); // { imageUrl: "https://s3.amazonaws.com/..." }
};

export const getProfile = () => fetchWithAuth('/user/profile');
export const updateProfile = (name) => fetchWithAuth('/user/profile', { method: 'PUT', body: JSON.stringify({ name }) });
