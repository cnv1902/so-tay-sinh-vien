import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Checkbox, Popconfirm, message, Space, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getMainApiUrl } from '../../config/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function LocationManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  
  const apiUrl = `${getMainApiUrl()}/api/admin/locations`;

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
      form.setFieldsValue(record);
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
      
      message.success(editingRecord ? 'Cập nhật địa điểm thành công' : 'Thêm địa điểm thành công');
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
      message.success('Xóa địa điểm thành công');
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: 'Tên địa điểm',
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
      title: 'Tọa độ (Lat, Lng)',
      key: 'gps',
      render: (_, r) => (
        <Space orientation="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: '12px' }}>Lat: {r.latitude?.toFixed(5) || 'N/A'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>Lng: {r.longitude?.toFixed(5) || 'N/A'}</Text>
          {r.map_link && <a href={r.map_link} target="_blank" rel="noreferrer" style={{ fontSize: '12px' }}>Xem bản đồ</a>}
        </Space>
      )
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (status) => (
        status === 'approved' 
          ? <Tag color="green" style={{ borderRadius: 0 }}><CheckCircleOutlined /> Hiện</Tag> 
          : <Tag color="orange" style={{ borderRadius: 0 }}><CloseCircleOutlined /> Chờ duyệt</Tag>
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
            onClick={() => openModal({ ...record, is_approved: record.approval_status === 'approved' })} 
            style={{ borderRadius: 0 }}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa địa điểm này?"
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
        <Title level={4} style={{ margin: 0, color: 'var(--text-main)' }}>Quản lý Địa điểm</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => openModal()}
          style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)' }}
        >
          Thêm địa điểm
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
        title={editingRecord ? 'Cập nhật Địa điểm' : 'Thêm Địa điểm mới'}
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
          initialValues={{ is_approved: true }}
        >
          <Form.Item
            name="name"
            label="Tên địa điểm/Tòa nhà"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Tòa nhà A, Canteen..." style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select placeholder="Chọn danh mục" style={{ borderRadius: 0 }}>
              <Option value="Phòng học">Phòng học</Option>
              <Option value="Canteen">Canteen</Option>
              <Option value="Trạm Bus">Trạm Bus</Option>
              <Option value="Bệnh viện">Bệnh viện</Option>
              <Option value="Khác">Khác</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="map_link"
            label="Link Google Maps"
          >
            <Input placeholder="Nhập link để tự động trích xuất tọa độ..." style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={4} placeholder="Mô tả về địa điểm này..." style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item
            name="is_approved"
            valuePropName="checked"
          >
            <Checkbox style={{ borderRadius: 0 }}>Phê duyệt hiển thị trên bản đồ</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
