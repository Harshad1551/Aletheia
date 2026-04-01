
import api from './api';

const chatService = {
    // Get all chats for the user
    getHistory: async () => {
        try {
            const response = await api.get('/chatbot/history');
            return response.data;
        } catch (error) {
            console.error("Get History Error:", error);
            throw error.response?.data?.message || "Failed to load chat history.";
        }
    },

    // Get messages for a specific chat
    getMessages: async (chatId) => {
        try {
            const response = await api.get(`/chatbot/${chatId}`);
            return response.data;
        } catch (error) {
            console.error("Get Messages Error:", error);
            throw error.response?.data?.message || "Failed to load messages.";
        }
    },

    // Send a message (start new chat or reply to existing)
    sendMessage: async (message, chatId = null, avatarName) => {
        try {
            const response = await api.post('/chatbot/chat', { message, chatId, avatarName });
            return response.data;
        } catch (error) {
            console.error("Chat Error:", error);
            throw error.response?.data?.message || "Failed to send message.";
        }
    },

    // Transcribe audio via Sarvam AI STT
    transcribeAudio: async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await api.post('/stt/transcribe', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.transcript || '';
        } catch (error) {
            console.error("STT Error:", error);
            throw error.response?.data?.message || "Failed to transcribe audio.";
        }
    }
};

export default chatService;
