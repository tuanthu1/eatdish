

# EatDish-Project/
│
├── client/                     # FRONTEND (ReactJS + Vite)
│   ├── public/                 # File tĩnh (favicon, index.html gốc)
│   ├── src/
│   │   ├── assets/             # Hình ảnh, icon, file CSS chung
│   │   │   └── styles.css
│   │   ├── components/         # Các thành phần nhỏ tái sử dụng
│   │   │   ├── Sidebar.jsx     # Cột menu trái
│   │   │   ├── Navbar.jsx      # Thanh tìm kiếm trên cùng
│   │   │   ├── RecipeCard.jsx  # Thẻ món ăn
│   │   │   └── Modal.jsx       # Popup xem chi tiết/upload
│   │   ├── pages/              # Các trang chính
│   │   │   ├── HomePage.jsx    # Trang User (index.html cũ)
│   │   │   ├── AdminPage.jsx   # Trang Admin (admin.html cũ)
│   │   │   └── LoginPage.jsx   # Trang Đăng nhập (login.html cũ)
│   │   ├── api/                # Nơi gọi API xuống Backend
│   │   │   └── axiosClient.js  # Cấu hình axios
│   │   ├── context/            # Quản lý trạng thái đăng nhập (AuthContext)
│   │   ├── App.jsx             # File chính điều hướng (Router)
│   │   └── main.jsx            # Điểm khởi chạy React
│   ├── package.json            # Thư viện Frontend (React, React-Router, Axios...)
│   └── vite.config.js          # Cấu hình Vite
│
├── server/                     # BACKEND (Node.js + Express)
│   ├── config/                 # Cấu hình kết nối Database
│   │   └── db.js               # Kết nối MySQL/MongoDB
│   ├── controllers/            # Xử lý logic (Thêm, Sửa, Xóa)
│   │   ├── recipeController.js # Logic món ăn
│   │   └── userController.js   # Logic người dùng/đăng nhập
│   ├── models/                 # Định nghĩa cấu trúc dữ liệu (Schema)
│   │   ├── RecipeModel.js
│   │   └── UserModel.js
│   ├── routes/                 # Định nghĩa đường dẫn API (URL)
│   │   ├── recipeRoutes.js     # Ví dụ: /api/recipes
│   │   └── userRoutes.js       # Ví dụ: /api/auth/login
│   ├── uploads/                # Chứa ảnh user upload lên server
│   ├── .env                    # Biến môi trường (DB password, Port)
│   ├── index.js                # File chạy Server chính
│   └── package.json            # Thư viện Backend (Express, Mysql2, Cors...)
│
└── README.md                   # Hướng dẫn chạy dự án

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
