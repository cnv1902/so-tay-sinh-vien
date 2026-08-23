import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space, Typography, Tag, DatePicker, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMainApiUrl } from '../../config/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CATEGORY_MAP = {
  'ACADEMIC': { label: '🎓 Lịch đào tạo', color: 'blue' },
  'HOLIDAY': { label: '🏖️ Nghỉ lễ', color: 'magenta' },
  'EXTRACURRICULAR': { label: '🤝 Hoạt động Đoàn - Hội', color: 'green' }
};

export default function CalendarManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isAllDay, setIsAllDay] = useState(true);
  const [form] = Form.useForm();
  
  const apiUrl = `${getMainApiUrl()}/api/admin/calendar`;

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
      const allDay = record.is_all_day !== false;
      setIsAllDay(allDay);
      form.setFieldsValue({
        title: record.title,
        description: record.description || '',
        category: record.category,
        is_all_day: allDay,
        is_annual: record.is_annual || false,
        timeRange: [dayjs(record.start_time), dayjs(record.end_time)]
      });
    } else {
      setIsAllDay(true);
      form.resetFields();
      form.setFieldsValue({ is_all_day: true, is_annual: false, category: 'ACADEMIC', description: '' });
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
        title: values.title,
        description: values.description || null,
        category: values.category,
        is_all_day: values.is_all_day,
        is_annual: values.is_annual || false,
        start_time: values.timeRange[0].toISOString(),
        end_time: values.timeRange[1].toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Thao tác thất bại');
      
      message.success(editingRecord ? 'Cập nhật sự kiện thành công' : 'Thêm sự kiện thành công');
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
      message.success('Xóa sự kiện thành công');
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: 'Tiêu đề sự kiện',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text ? <span style={{ color: 'var(--text-muted)' }}>{text}</span> : '-'
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const catConfig = CATEGORY_MAP[category] || { label: category, color: 'default' };
        return <Tag color={catConfig.color} style={{ borderRadius: 0 }}>{catConfig.label}</Tag>
      }
    },
    {
      title: 'Bắt đầu',
      key: 'start_time',
      render: (_, record) => {
        const isAllDay = record.is_all_day !== false;
        const format = record.is_annual 
          ? (isAllDay ? 'DD/MM' : 'HH:mm DD/MM') 
          : (isAllDay ? 'DD/MM/YYYY' : 'HH:mm DD/MM/YYYY');
        return dayjs(record.start_time).format(format);
      }
    },
    {
      title: 'Kết thúc',
      key: 'end_time',
      render: (_, record) => {
        const isAllDay = record.is_all_day !== false;
        const format = record.is_annual 
          ? (isAllDay ? 'DD/MM' : 'HH:mm DD/MM') 
          : (isAllDay ? 'DD/MM/YYYY' : 'HH:mm DD/MM/YYYY');
        return dayjs(record.end_time).format(format);
      }
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
            title="Bạn có chắc chắn muốn xóa sự kiện này?"
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
        <Title level={4} style={{ margin: 0, color: 'var(--text-main)' }}>Quản lý Lịch & Sự kiện</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => openModal()}
          style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)' }}
        >
          Thêm sự kiện
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        variant="outlined"
        pagination={{ pageSize: 10 }}
        style={{ borderRadius: 0 }}
      />

      <Modal
        title={editingRecord ? 'Cập nhật Sự kiện' : 'Thêm Sự kiện mới'}
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
          initialValues={{ is_all_day: true, category: 'ACADEMIC' }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề sự kiện"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Tên sự kiện" style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả sự kiện"
          >
            <Input.TextArea placeholder="Nhập mô tả chi tiết (tùy chọn)..." rows={3} style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select placeholder="Chọn danh mục" style={{ borderRadius: 0 }}>
              <Option value="ACADEMIC">🎓 Lịch đào tạo</Option>
              <Option value="HOLIDAY">🏖️ Nghỉ lễ</Option>
              <Option value="EXTRACURRICULAR">🤝 Hoạt động Đoàn - Hội</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="is_all_day"
            label="Sự kiện cả ngày"
            valuePropName="checked"
          >
            <Switch onChange={(checked) => setIsAllDay(checked)} />
          </Form.Item>

          <Form.Item
            name="is_annual"
            label="Lặp lại hàng năm (Dương lịch)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Thời gian diễn ra"
            rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
          >
            <RangePicker 
              showTime={!isAllDay} 
              format={isAllDay ? "DD/MM/YYYY" : "DD/MM/YYYY HH:mm"} 
              style={{ borderRadius: 0, width: '100%' }} 
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
