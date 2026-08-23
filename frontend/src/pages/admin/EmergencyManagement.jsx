import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, InputNumber, Popconfirm, message, Space, Typography, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMainApiUrl } from '../../config/api';

const { Title } = Typography;
const { TextArea } = Input;

export default function EmergencyManagement() {
  return (
    <div>
      <Title level={4} style={{ margin: 0, marginBottom: '24px', color: 'var(--text-main)' }}>
        Quản lý Liên hệ Khẩn cấp & Mẫu tin nhắn
      </Title>
      
      <Tabs 
        defaultActiveKey="contacts" 
        items={[
          { key: 'contacts', label: 'Danh bạ SOS', children: <ContactsTab /> },
          { key: 'templates', label: 'Mẫu tin nhắn', children: <TemplatesTab /> }
        ]}
      />
    </div>
  );
}

// ==========================================
// TAB 1: DANH BẠ SOS
// ==========================================
function ContactsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterWard, setFilterWard] = useState(null);
  const [extractingMap, setExtractingMap] = useState(false);
  const [mapUrl, setMapUrl] = useState('');
  
  const apiUrl = `${getMainApiUrl()}/api/admin/emergency/contacts`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Lỗi tải dữ liệu danh bạ');
      const result = await res.json();
      setData(result);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (record = null) => {
    setEditingRecord(record);
    if (record) form.setFieldsValue(record);
    else form.resetFields();
    setMapUrl('');
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setMapUrl('');
  };

  const handleExtractLocation = async () => {
    if (!mapUrl) {
      message.warning('Vui lòng nhập Link Google Maps');
      return;
    }
    setExtractingMap(true);
    try {
      const res = await fetch(`${getMainApiUrl()}/api/admin/emergency/extract-map-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mapUrl })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Không thể bóc tách tọa độ');
      }
      const data = await res.json();
      form.setFieldsValue({ latitude: data.latitude, longitude: data.longitude });
      message.success('Đã bóc tách tọa độ thành công');
    } catch (error) {
      message.error(error.message);
    } finally {
      setExtractingMap(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const url = editingRecord ? `${apiUrl}/${editingRecord.id}` : apiUrl;
      const method = editingRecord ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error('Thao tác thất bại');
      
      message.success(editingRecord ? 'Cập nhật danh bạ thành công' : 'Thêm danh bạ thành công');
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
      message.success('Đã xóa liên hệ');
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    { title: 'Tên liên hệ', dataIndex: 'name', key: 'name', render: t => <strong>{t}</strong> },
    { 
      title: 'Danh mục', 
      dataIndex: 'category', 
      key: 'category',
      render: (cat) => {
        const colors = { POLICE: 'blue', MEDICAL: 'red', FIRE_RESCUE: 'orange', CAMPUS_SECURITY: 'green' };
        const labels = { POLICE: 'Công an', MEDICAL: 'Y tế', FIRE_RESCUE: 'Cứu hỏa', CAMPUS_SECURITY: 'Hỗ trợ nội bộ' };
        return <Tag color={colors[cat] || 'default'}>{labels[cat] || cat}</Tag>;
      }
    },
    { title: 'Phường/Xã', dataIndex: 'ward', key: 'ward', render: w => w || 'N/A' },
    { title: 'Số điện thoại', dataIndex: 'phone_number', key: 'phone_number' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { 
      title: 'Tọa độ GPS', 
      key: 'gps',
      render: (_, r) => r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : 'N/A'
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" ghost icon={<EditOutlined />} onClick={() => openModal(record)} style={{ borderRadius: 0 }} />
          <Popconfirm title="Xóa liên hệ này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true, style: { borderRadius: 0 } }} cancelButtonProps={{ style: { borderRadius: 0 } }}>
            <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 0 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = data.filter(item => {
    let matchCat = filterCategory ? item.category === filterCategory : true;
    let matchWard = filterWard ? item.ward === filterWard : true;
    return matchCat && matchWard;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Space>
          <Select 
            placeholder="Lọc theo Danh mục" 
            style={{ width: 180, borderRadius: 0 }} 
            allowClear
            onChange={setFilterCategory}
            options={[
              { value: 'POLICE', label: 'Công an' },
              { value: 'MEDICAL', label: 'Y tế' },
              { value: 'FIRE_RESCUE', label: 'Cứu hỏa' },
              { value: 'CAMPUS_SECURITY', label: 'Hỗ trợ nội bộ' }
            ]}
          />
          <Select 
            placeholder="Lọc theo Phường/Xã" 
            style={{ width: 180, borderRadius: 0 }} 
            allowClear
            onChange={setFilterWard}
            options={[
              { value: 'Trường Vinh', label: 'Trường Vinh' },
              { value: 'Thành Vinh', label: 'Thành Vinh' },
              { value: 'Vinh Hưng', label: 'Vinh Hưng' },
              { value: 'Vinh Phú', label: 'Vinh Phú' },
              { value: 'Vinh Lộc', label: 'Vinh Lộc' },
              { value: 'Cửa Lò', label: 'Cửa Lò' }
            ]}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)' }}>
          Thêm số khẩn cấp
        </Button>
      </div>
      <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} bordered pagination={{ pageSize: 10 }} style={{ borderRadius: 0 }} />
      <Modal title={editingRecord ? 'Cập nhật danh bạ' : 'Thêm danh bạ SOS'} open={isModalVisible} onCancel={handleCancel} onOk={() => form.submit()} okText="Lưu" cancelText="Hủy" okButtonProps={{ style: { borderRadius: 0, backgroundColor: 'var(--primary-blue)' } }} cancelButtonProps={{ style: { borderRadius: 0 } }} styles={{ content: { borderRadius: 0 } }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ category: 'POLICE' }}>
          <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
            <Select style={{ borderRadius: 0 }} options={[
              { value: 'POLICE', label: 'Công an' },
              { value: 'MEDICAL', label: 'Y tế' },
              { value: 'FIRE_RESCUE', label: 'Cứu hỏa' },
              { value: 'CAMPUS_SECURITY', label: 'Hỗ trợ nội bộ' }
            ]} />
          </Form.Item>
          <Form.Item name="ward" label="Phường/Xã (Quản lý)">
            <Select style={{ borderRadius: 0 }} allowClear options={[
              { value: 'Trường Vinh', label: 'Trường Vinh' },
              { value: 'Thành Vinh', label: 'Thành Vinh' },
              { value: 'Vinh Hưng', label: 'Vinh Hưng' },
              { value: 'Vinh Phú', label: 'Vinh Phú' },
              { value: 'Vinh Lộc', label: 'Vinh Lộc' },
              { value: 'Cửa Lò', label: 'Cửa Lò' }
            ]} />
          </Form.Item>
          <Form.Item name="name" label="Tên đơn vị/Người liên hệ" rules={[{ required: true }]}>
            <Input style={{ borderRadius: 0 }} />
          </Form.Item>
          <Form.Item name="phone_number" label="Số điện thoại khẩn cấp" rules={[{ required: true }]}>
            <Input style={{ borderRadius: 0 }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chức năng">
            <Input style={{ borderRadius: 0 }} />
          </Form.Item>
          
          <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-card)', border: '1px solid #d9d9d9' }}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Trợ lý điền tọa độ (Tùy chọn)</Typography.Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input 
                placeholder="Dán link Google Maps (VD: maps.app.goo.gl/...)" 
                value={mapUrl}
                onChange={e => setMapUrl(e.target.value)}
                style={{ borderRadius: 0 }}
              />
              <Button 
                type="primary" 
                onClick={handleExtractLocation} 
                loading={extractingMap}
                style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)' }}
              >
                Lấy tọa độ
              </Button>
            </Space.Compact>
          </div>

          <Space>
            <Form.Item name="latitude" label="Vĩ độ (Lat)">
              <InputNumber style={{ borderRadius: 0, width: '100%' }} />
            </Form.Item>
            <Form.Item name="longitude" label="Kinh độ (Lng)">
              <InputNumber style={{ borderRadius: 0, width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

// ==========================================
// TAB 2: MẪU TIN NHẮN
// ==========================================
function TemplatesTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  
  const apiUrl = `${getMainApiUrl()}/api/admin/emergency/templates`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Lỗi tải dữ liệu mẫu tin');
      const result = await res.json();
      setData(result);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (record = null) => {
    setEditingRecord(record);
    if (record) form.setFieldsValue(record);
    else form.resetFields();
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
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error('Thao tác thất bại');
      
      message.success(editingRecord ? 'Cập nhật mẫu tin thành công' : 'Thêm mẫu tin thành công');
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
      message.success('Đã xóa mẫu tin');
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    { title: 'Phân loại (Category)', dataIndex: 'category', key: 'category', render: t => <strong>{t}</strong>, width: '25%' },
    { title: 'Mẫu tin nhắn', dataIndex: 'message_template', key: 'message_template' },
    {
      title: 'Thao tác',
      key: 'action',
      width: '15%',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" ghost icon={<EditOutlined />} onClick={() => openModal(record)} style={{ borderRadius: 0 }} />
          <Popconfirm title="Xóa mẫu tin này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true, style: { borderRadius: 0 } }} cancelButtonProps={{ style: { borderRadius: 0 } }}>
            <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 0 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '16px', textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)' }}>
          Thêm mẫu tin
        </Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} bordered pagination={{ pageSize: 10 }} style={{ borderRadius: 0 }} />
      <Modal title={editingRecord ? 'Cập nhật mẫu tin' : 'Thêm mẫu tin khẩn cấp'} open={isModalVisible} onCancel={handleCancel} onOk={() => form.submit()} okText="Lưu" cancelText="Hủy" okButtonProps={{ style: { borderRadius: 0, backgroundColor: 'var(--primary-blue)' } }} cancelButtonProps={{ style: { borderRadius: 0 } }} styles={{ content: { borderRadius: 0 } }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="category" label="Phân loại (VD: Hỏa hoạn, Y tế)" rules={[{ required: true }]}>
            <Input style={{ borderRadius: 0 }} />
          </Form.Item>
          <Form.Item name="message_template" label="Mẫu tin nhắn" rules={[{ required: true }]}>
            <TextArea rows={4} style={{ borderRadius: 0 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
