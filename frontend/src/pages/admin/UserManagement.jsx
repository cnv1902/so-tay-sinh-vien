import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMainApiUrl } from '../../config/api';

const { Title } = Typography;
const { Option } = Select;

export default function UserManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  
  const apiUrl = `${getMainApiUrl()}/api/admin/users`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Không thể tải dữ liệu');
      const result = await res.json();
      setData(result);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (record = null) => {
    setEditingRecord(record);
    if (record) {
      form.setFieldsValue({
        username: record.username,
        full_name: record.full_name,
        role: record.role,
        nationality: record.nationality,
        department: record.department
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const url = editingRecord ? `${apiUrl}/${editingRecord.id}` : apiUrl;
      const method = editingRecord ? 'PUT' : 'POST';
      
      const payload = { ...values };
      // Nếu là edit và password rỗng, xóa trường password để tránh lỗi cập nhật mk trống
      if (editingRecord && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Thao tác thất bại');
      
      message.success(editingRecord ? 'Cập nhật người dùng thành công' : 'Thêm người dùng thành công');
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa thất bại');
      message.success('Xóa người dùng thành công');
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: 'Tài khoản',
      dataIndex: 'username',
      key: 'username',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        role === 'Admin' 
          ? <Tag color="var(--primary-blue)" style={{ borderRadius: 0 }}>Quản trị</Tag> 
          : <Tag style={{ borderRadius: 0 }}>Sinh viên</Tag>
      )
    },
    {
      title: 'Quốc tịch',
      dataIndex: 'nationality',
      key: 'nationality',
    },
    {
      title: 'Khoa',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Hoạt động cuối',
      dataIndex: 'last_active',
      key: 'last_active',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN') : 'Chưa hoạt động'
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            ghost 
            icon={<EditOutlined />} 
            onClick={() => openModal(record)} 
            style={{ borderRadius: 0 }}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa tài khoản này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, style: { borderRadius: 0 } }}
            cancelButtonProps={{ style: { borderRadius: 0 } }}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              style={{ borderRadius: 0 }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0, color: 'var(--text-main)' }}>Quản lý Người dùng</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => openModal()}
          style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)' }}
        >
          Thêm người dùng
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
        style={{ borderRadius: 0 }}
      />

      <Modal
        title={editingRecord ? 'Cập nhật Người dùng' : 'Thêm Người dùng mới'}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingRecord ? 'Lưu' : 'Thêm'}
        cancelText="Hủy"
        okButtonProps={{ style: { borderRadius: 0, backgroundColor: 'var(--primary-blue)' } }}
        cancelButtonProps={{ style: { borderRadius: 0 } }}
        styles={{ content: { borderRadius: 0 } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ role: 'Student' }}
        >
          <Form.Item
            name="username"
            label="Tài khoản đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
          >
            <Input placeholder="Tên đăng nhập" style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input placeholder="Nhập họ và tên đầy đủ" style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingRecord ? "Mật khẩu (Bỏ trống nếu không đổi)" : "Mật khẩu"}
            rules={[{ required: !editingRecord, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" style={{ borderRadius: 0 }} />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select placeholder="Chọn vai trò" style={{ borderRadius: 0 }}>
              <Option value="Admin">Admin (Quản trị viên)</Option>
              <Option value="Student">Student (Sinh viên)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="nationality"
            label="Quốc tịch"
          >
            <Input placeholder="Việt Nam, Lào..." style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item
            name="department"
            label="Khoa trực thuộc"
          >
            <Input placeholder="CNTT, Kinh tế..." style={{ borderRadius: 0 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
