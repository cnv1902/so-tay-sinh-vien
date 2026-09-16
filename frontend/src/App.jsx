import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout";
import DocumentUpload from "./pages/admin/DocumentUpload";
import ChunkReview from "./pages/admin/ChunkReview";
import DocumentManagement from "./pages/admin/DocumentManagement";
import UserManagement from "./pages/admin/UserManagement";
import EmergencyManagement from "./pages/admin/EmergencyManagement";
import CalendarManagement from "./pages/admin/CalendarManagement";
import NewsManagement from "./pages/admin/NewsManagement";
import LocationManagement from "./pages/admin/LocationManagement";
import ChatbotConfig from "./pages/admin/ChatbotConfig";
import AdminLogin from "./pages/admin/AdminLogin";
import DepartmentsManagement from "./pages/admin/DepartmentsManagement";
import VinhUniMap from "./pages/admin/VinhUniMap";
import TestChat from "./pages/TestChat";

// Component để bảo vệ các route cần đăng nhập
const ProtectedRoute = () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    if (payload.role === 'CANDIDATE' || payload.role === 'Student') {
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    console.error("Lỗi parse token", e);
    localStorage.removeItem("access_token"); // Xóa token lỗi
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Public Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Public Chat Testing Route */}
        <Route path="/chat" element={<TestChat />} />

        {/* Protected Admin Nested Routes */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/documents" replace />} />
            <Route path="documents" element={<DocumentUpload />} />
            <Route path="documents/:id/review" element={<ChunkReview />} />
            <Route path="cms_documents" element={<DocumentManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="emergency" element={<EmergencyManagement />} />
            <Route path="calendar" element={<CalendarManagement />} />
            <Route path="news" element={<NewsManagement />} />
            <Route path="locations" element={<LocationManagement />} />
            <Route path="departments" element={<DepartmentsManagement />} />
            <Route path="vinhuni-map" element={<VinhUniMap />} />
            <Route path="chatbot" element={<ChatbotConfig />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
