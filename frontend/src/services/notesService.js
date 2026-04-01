/**
 * Notes Service
 * Handles uploading audio/video recordings for transcription.
 */
const API_URL = 'http://localhost:3000';

const notesService = {
    /**
     * Upload a recording file for transcription + summary.
     * @param {File} file  - Audio/video file
     * @param {string} email - Recipient email
     * @param {(pct: number) => void} onProgress - Upload progress callback (0-100)
     * @returns {Promise<{ status: string, message: string }>}
     */
    transcribeRecording: (file, email, onProgress) => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('email', email);

            const user = JSON.parse(localStorage.getItem('user'));
            const token = user?.token;

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(data.error || 'Transcription failed'));
                    }
                } catch {
                    reject(new Error('Invalid server response'));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error. Is the server running?')));
            xhr.addEventListener('timeout', () => reject(new Error('Request timed out. Large files may take up to 30 minutes.')));

            xhr.open('POST', `${API_URL}/notes/transcribe`);
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.timeout = 35 * 60 * 1000; // 35 minutes
            xhr.send(formData);
        });
    },
};

export default notesService;
