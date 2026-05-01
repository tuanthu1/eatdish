import axios from "axios";

const isLocalhost = window.location.hostname === 'localhost';

const axiosClient = axios.create({
    baseURL: "http://localhost:5000/api" ,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 🛑 LỚP BỌC THÉP 1: Chống sập web khi Server tắt hoặc bị lỗi CORS
        if (!error.response) {
            console.error("Lỗi mạng hoặc Server đang tắt (CORS/Network Error)");
            return Promise.reject(error);
        }

        // Lấy response và config chuẩn từ object error ra
        const res = error.response;
        const config = error.config;

        // 🛑 LỚP BỌC THÉP 2: Xử lý vụ hết hạn Token (Lỗi 401)
        if (res.status === 401) {
            
            // Nếu đang gọi API check Auth ngầm thì kệ nó, đừng đá văng người ta ra Login
            if (config.url.includes('/auth/me')) {
                return Promise.reject(error);
            }

            // Nếu gọi API khác mà bị 401 thì mới đá ra
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '/login-register?expired=true';
        }
        
        return Promise.reject(error);
    }
);

export default axiosClient;