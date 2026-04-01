
import api from './api';

const authService = {
    // Signup
    signup: async (userData) => {
        try {
            const response = await api.post('/auth/signup', userData);
            if (response.data.token) {
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Signup failed. Please try again.";
        }
    },

    // Login
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            if (response.data.token) {
                localStorage.setItem('user', JSON.stringify(response.data));
               console.log(JSON.parse(localStorage.getItem('user')));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Login failed. Please check your credentials.";
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('user');
    },

    // Get current user
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    },

    // Check if the stored JWT token is expired
    isTokenExpired: () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user?.token) return true;

            // JWT payload is the second segment, base64-encoded
            const payload = JSON.parse(atob(user.token.split('.')[1]));
            // exp is in seconds; Date.now() is in ms
            return Date.now() >= payload.exp * 1000;
        } catch {
            return true; // Treat malformed tokens as expired
        }
    },

    // Returns true only if a valid, unexpired token exists
    isAuthenticated: () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user?.token) return false;
        return !authService.isTokenExpired();
    },

    // Fetch the authenticated user's full profile from the backend
    getProfile: async () => {
        try {
            const response = await api.get('/auth/profile');
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Failed to fetch profile.";
        }
    }
};

export default authService;
