import api from './api';

const diaryService = {
    /** Fetch all diary entries for the logged-in user */
    getEntries: async () => {
        const res = await api.get('/diary');
        return res.data;
    },

    /** Create a new diary entry */
    createEntry: async (title, content) => {
        const res = await api.post('/diary', { title, content });
        return res.data;
    },

    /** Delete a diary entry by ID */
    deleteEntry: async (id) => {
        const res = await api.delete(`/diary/${id}`);
        return res.data;
    },
};

export default diaryService;
