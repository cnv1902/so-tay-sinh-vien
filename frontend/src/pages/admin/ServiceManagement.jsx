import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Checkbox, Popconfirm, message, Space, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getMainApiUrl } from '../../config/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const { Title } = Typography;
const { Option } = Select;

export default function ServiceManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const quillRef = useRef(null);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean']
      ]
    }
  }), []);
  
  const apiUrl = `${getMainApiUrl()}/api/admin/services`;

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
      form.setFieldsValue({ ...record, is_approved: record.approval_status === 'approved' });
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
      
      const payload = {
        ...values,
        approval_status: values.is_approved ? 'approved' : 'pending'
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Thao tác thất bại');
      
      message.success(editingRecord ? 'Cập nhật dịch vụ thành công' : 'Thêm dịch vụ thành công');
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
      message.success('Xóa dịch vụ thành công');
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: 'Tên dịch vụ',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (status) => (
        status === 'approved' 
          ? <Tag color="green" style={{ borderRadius: 0 }}><CheckCircleOutlined /> Đang hoạt động</Tag> 
          : <Tag color="orange" style={{ borderRadius: 0 }}><CloseCircleOutlined /> Ngưng hoạt động</Tag>
      )
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
            title="Bạn có chắc chắn muốn xóa dịch vụ này?"
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
        <Title level={4} style={{ margin: 0, color: 'var(--text-main)' }}>Quản lý Dịch vụ & Hỗ trợ</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => openModal()}
          style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)' }}
        >
          Thêm dịch vụ
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
        title={editingRecord ? 'Cập nhật Dịch vụ' : 'Thêm Dịch vụ mới'}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingRecord ? 'Lưu' : 'Thêm'}
        cancelText="Hủy"
        width="70vw"
        style={{ top: '5vh' }}
        okButtonProps={{ style: { borderRadius: 0, backgroundColor: 'var(--primary-blue)' } }}
        cancelButtonProps={{ style: { borderRadius: 0 } }}
        styles={{ 
          content: { borderRadius: 0 },
          body: { height: '65vh', overflowY: 'auto' }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ is_approved: true }}
        >
          <Form.Item
            name="name"
            label="Tên dịch vụ (VD: Đăng ký thẻ sinh viên, Ký túc xá...)"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Nhập tên dịch vụ" style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select placeholder="Chọn danh mục" style={{ borderRadius: 0 }}>
              <Option value="Hành chính">Hành chính</Option>
              <Option value="Đời sống">Đời sống</Option>
              <Option value="Công nghệ">Công nghệ</Option>
              <Option value="Khác">Khác</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Hướng dẫn sử dụng / Chi tiết"
            rules={[{ required: true, message: 'Vui lòng nhập hướng dẫn' }]}
          >
            <ReactQuill ref={quillRef} theme="snow" modules={modules} placeholder="Nhập hướng dẫn chi tiết..." style={{ height: '35vh', marginBottom: '40px' }} />
          </Form.Item>

          <Form.Item
            name="is_approved"
            valuePropName="checked"
          >
            <Checkbox style={{ borderRadius: 0 }}>Dịch vụ đang hoạt động</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
