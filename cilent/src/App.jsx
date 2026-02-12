import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import Auth from './pages/auth/Auth'; 
import RecipeDetailPage from './pages/RecipeDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound/NotFound';
import VerifyEmail from './pages/auth/VerifyEmail';
import AdminPage from './pages/Admin/AdminPage'; 
import PremiumSuccess from './pages/PremiumSuccess';
import ResetPassword from './pages/auth/ResetPassword';

const AdminRoute = ({ user, isChecking, children }) => {
    if (isChecking) {
        return <div style={{textAlign: 'center', marginTop: '50px'}}>⏳ Đang tải dữ liệu...</div>;
    }
    if (!user || user.role !== 'admin') {
        return <Navigate to="/not-found" replace />; 
    }
    return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  useEffect(() => {
    const userId = localStorage.getItem('eatdish_user_id');
    const userRole = localStorage.getItem('eatdish_user_role');
    const token = localStorage.getItem('token');

    if (userId && userRole && token) {
        setUser({ id: userId, role: userRole });
    } else {
        console.log(" Không tìm thấy thông tin đăng nhập đầy đủ.");
    }

    setIsChecking(false);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login-register" element={<Auth setUser={setUser} />} />
        <Route path="/premium-success" element={<PremiumSuccess />} />
        <Route path="/not-found" element={<NotFound />} />
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route 
            path="/admin" 
            element={
                <AdminRoute user={user} isChecking={isChecking}>
                    <AdminPage />
                </AdminRoute>
            } 
        />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
