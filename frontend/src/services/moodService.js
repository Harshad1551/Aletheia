import api from './api';

const moodService = {
    getMoodData: async () => {
        const response = await api.get('/mood');
        return response.data; // { anger: 3, joy: 12, neutral: 8, ... }
    },
    getMoodHistory: async () => {
        const response = await api.get('/mood/history');
        return response.data; // [{ date: 'Mon', joy: 3, sadness: 1, ... }, ...]
    }
};

export default moodService;
