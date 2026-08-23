import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Button, Avatar, message } from 'antd';
import { ArrowLeft, User } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

const { Header, Content } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const showToast = (msg, type = 'success') => {
    messageApi[type](msg);
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {contextHolder}
      
      {/* SIDEBAR BÊN TRÁI */}
      <AdminSidebar />

      {/* VÙNG BÊN PHẢI */}
      <Layout>
        {/* HEADER */}
        <Header style={{ 
          backgroundColor: 'var(--bg-white)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 32px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end', /* Đẩy nội dung sang góc phải */
          gap: '16px'
        }}>
          <Button 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/')}
            style={{
              borderRadius: 0,
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            VỀ CHATBOT
          </Button>
          <Avatar 
            size={40} 
            icon={<User size={20} />} 
            style={{ 
              borderRadius: 0, 
              backgroundColor: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} 
          />
        </Header>

        {/* CONTENT */}
        <Content style={{ padding: '24px', overflowY: 'auto' }}>
          <div style={{
            backgroundColor: 'var(--bg-white)',
            border: '1px solid var(--border-color)',
            minHeight: 'calc(100vh - 70px - 48px)', // Trừ header và padding
            padding: '32px',
            boxShadow: 'var(--shadow-sharp)',
            borderRadius: 0,
            marginTop: '8px' // Cách nhẹ với Header
          }}>
            <Outlet context={{ showToast }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
