import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  PhoneCall, 
  Calendar, 
  Newspaper, 
  MapPin, 
  Map as MapIcon,
  Activity,
  Building
} from 'lucide-react';

const { Sider } = Layout;

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/admin/documents', icon: <FileText size={18} />, label: 'Quản lý Tài liệu' },
    { key: '/admin/users', icon: <Users size={18} />, label: 'Người dùng' },
    { key: '/admin/emergency', icon: <PhoneCall size={18} />, label: 'Liên hệ Khẩn cấp' },
    { key: '/admin/calendar', icon: <Calendar size={18} />, label: 'Lịch & Sự kiện' },
    { key: '/admin/news', icon: <Newspaper size={18} />, label: 'Tin tức & Bài viết' },
    { key: '/admin/departments', icon: <Building size={18} />, label: 'Tòa nhà & Phòng ban' },
    { key: '/admin/vinhuni-map', icon: <MapIcon size={18} />, label: 'Bản đồ VinhUni' },
    { key: '/admin/chatbot', icon: <Activity size={18} />, label: 'Cấu hình Chatbot' },
  ];


  return (
    <Sider 
      width={280} 
      theme="light" 
      style={{ 
        borderRight: '1px solid var(--border-color)', 
        height: '100vh', 
        position: 'sticky', 
        top: 0,
        left: 0,
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color)',
        height: '70px'
      }}>
        <div style={{ width: '36px', height: '36px' }}>
          <img src="/dhv_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.05rem', 
          fontWeight: 700, 
          color: 'var(--text-main)', 
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          Sổ tay sinh viên
        </h2>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ 
          borderRight: 'none', 
          padding: '16px 8px',
          fontWeight: 500
        }}
      />
    </Sider>
  );
}
