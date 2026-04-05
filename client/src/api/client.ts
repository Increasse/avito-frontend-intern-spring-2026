import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Обработка ошибок
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;