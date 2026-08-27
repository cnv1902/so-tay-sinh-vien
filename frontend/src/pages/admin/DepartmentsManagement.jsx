import React, { useState, useEffect } from 'react';
import { Table, Button, Tabs, message, Space, Popconfirm, Tag, Input, Form, Modal, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMainApiUrl } from '../../config/api';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

export default function DepartmentsManagement() {
  const [activeTab, setActiveTab] = useState('departments');
  
  // Data States
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isDeptModalVisible, setIsDeptModalVisible] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm] = Form.useForm();

  const [isBuildingModalVisible, setIsBuildingModalVisible] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingForm] = Form.useForm();

  const fetchBuildings = async () => {
    try {
      const res = await fetch(`${getMainApiUrl()}/api/admin/buildings`);

      if (res.ok) {
        const data = await res.json();
        setBuildings(data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách tòa nhà:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${getMainApiUrl()}/api/admin/departments`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách phòng ban:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchBuildings(), fetchDepartments()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, type) => {
    const url = `${getMainApiUrl()}/api/admin/${type}/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        message.success("Xóa thành công!");
        fetchData();
      } else {
        message.error("Không thể xóa. Có thể dữ liệu đang được liên kết.");
      }
    } catch (error) {
      message.error("Lỗi kết nối khi xóa.");
    }
  };

  // --- Department Handlers ---
  const openDeptModal = (record = null) => {
    setEditingDept(record);
    if (record) {
      deptForm.setFieldsValue({
        name: record.name,
        building_id: record.building_id,
        floor: record.floor || '1',
        phone_number: record.phone_number || '',
        email: record.email || '',
        working_hours: record.working_hours || '',
        function_description: record.function_description || ''
      });
    } else {
      deptForm.resetFields();
      deptForm.setFieldsValue({ floor: '1' });
    }
    setIsDeptModalVisible(true);
  };

  const handleDeptSubmit = async (values) => {
    try {
      const url = editingDept 
        ? `${getMainApiUrl()}/api/admin/departments/${editingDept.id}` 
        : `${getMainApiUrl()}/api/admin/departments`;
      const method = editingDept ? 'PUT' : 'POST';

      // Chuẩn hóa payload: chuyển undefined sang null để backend nhận diện xóa liên kết
      const payload = {
        ...values,
        building_id: values.building_id === undefined ? null : values.building_id
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Thao tác thất bại');
      }

      message.success(editingDept ? 'Cập nhật phòng ban thành công' : 'Thêm phòng ban thành công');
      setIsDeptModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  // --- Building Handlers ---
  const openBuildingModal = (record = null) => {
    setEditingBuilding(record);
    if (record) {
      buildingForm.setFieldsValue({
        name: record.name,
        code: record.code,
        latitude: record.latitude,
        longitude: record.longitude,
        total_floors: record.total_floors || 1,
        description: record.description || ''
      });
    } else {
      buildingForm.resetFields();
      buildingForm.setFieldsValue({ total_floors: 1, latitude: 18.6658, longitude: 105.6945 });
    }
    setIsBuildingModalVisible(true);
  };

  const handleBuildingSubmit = async (values) => {
    try {
      const url = editingBuilding 
        ? `${getMainApiUrl()}/api/admin/buildings/${editingBuilding.id}` 
        : `${getMainApiUrl()}/api/admin/buildings`;
      const method = editingBuilding ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Thao tác thất bại');
      }

      message.success(editingBuilding ? 'Cập nhật tòa nhà thành công' : 'Thêm tòa nhà thành công');
      setIsBuildingModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const buildingColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tên Tòa Nhà', dataIndex: 'name', key: 'name' },
    { title: 'Mã', dataIndex: 'code', key: 'code', render: c => <Tag color="geekblue">{c}</Tag> },
    { title: 'Vĩ độ', dataIndex: 'latitude', key: 'latitude' },
    { title: 'Kinh độ', dataIndex: 'longitude', key: 'longitude' },
    { title: 'Số tầng', dataIndex: 'total_floors', key: 'total_floors', width: 90 },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            ghost 
            icon={<EditOutlined />} 
            onClick={() => openBuildingModal(record)} 
            style={{ borderRadius: 0 }}
          />
          <Popconfirm title="Chắc chắn xóa?" onConfirm={() => handleDelete(record.id, 'buildings')}>
            <Button type="text" danger icon={<DeleteOutlined />} style={{ borderRadius: 0 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const departmentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tên Phòng Ban', dataIndex: 'name', key: 'name' },
    { 
      title: 'Tòa Nhà', 
      dataIndex: 'building_id', 
      key: 'building_id',
      render: (building_id) => {
        const b = buildings.find(b => b.id === building_id);
        return b ? <Tag color="blue">{b.name}</Tag> : <Tag color="default">N/A</Tag>;
      }
    },
    { title: 'Tầng', dataIndex: 'floor', key: 'floor', width: 80 },
    { title: 'Mô tả', dataIndex: 'function_description', key: 'function_description', ellipsis: true },
    { title: 'SĐT', dataIndex: 'phone_number', key: 'phone_number' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            ghost 
            icon={<EditOutlined />} 
            onClick={() => openDeptModal(record)} 
            style={{ borderRadius: 0 }}
          />
          <Popconfirm title="Chắc chắn xóa?" onConfirm={() => handleDelete(record.id, 'departments')}>
            <Button type="text" danger icon={<DeleteOutlined />} style={{ borderRadius: 0 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Quản lý Tòa nhà & Phòng ban</h2>
        <Space>
          <Button onClick={fetchData} style={{ borderRadius: 0 }}>Làm mới</Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => activeTab === 'departments' ? openDeptModal() : openBuildingModal()}
            style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)' }}
          >
            {activeTab === 'departments' ? 'Thêm phòng ban' : 'Thêm tòa nhà'}
          </Button>
          <Button 
            onClick={async () => {
              try {
                const res = await fetch(`${getMainApiUrl()}/api/admin/departments/seed`, { method: 'POST' });
                if (res.ok) {
                  message.success("Đã đồng bộ dữ liệu từ GeoJSON thành công!");
                  fetchData();
                } else {
                  message.error("Đồng bộ thất bại");
                }
              } catch (e) {
                message.error("Lỗi đồng bộ");
              }
            }}
            style={{ borderRadius: 0 }}
          >
            Đồng bộ từ Bản đồ
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Phòng ban" key="departments">
          <Table 
            columns={departmentColumns} 
            dataSource={departments} 
            rowKey="id" 
            loading={loading}
            variant="outlined"
            pagination={{ pageSize: 10 }}
            style={{ borderRadius: 0 }}
          />
        </TabPane>
        <TabPane tab="Tòa nhà" key="buildings">
          <Table 
            columns={buildingColumns} 
            dataSource={buildings} 
            rowKey="id" 
            loading={loading}
            variant="outlined"
            pagination={{ pageSize: 10 }}
            style={{ borderRadius: 0 }}
          />
        </TabPane>
      </Tabs>

      {/* MODAL PHÒNG BAN */}
      <Modal
        title={editingDept ? "Chỉnh sửa Phòng ban" : "Thêm mới Phòng ban"}
        open={isDeptModalVisible}
        onCancel={() => setIsDeptModalVisible(false)}
        onOk={() => deptForm.submit()}
        okText={editingDept ? "Lưu" : "Thêm"}
        cancelText="Hủy"
        okButtonProps={{ style: { borderRadius: 0, backgroundColor: 'var(--primary-blue)' } }}
        cancelButtonProps={{ style: { borderRadius: 0 } }}
        styles={{ content: { borderRadius: 0 } }}
      >
        <Form form={deptForm} layout="vertical" onFinish={handleDeptSubmit}>
          <Form.Item name="name" label="Tên phòng ban / Đơn vị" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="Ví dụ: Phòng Đào tạo" style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item name="building_id" label="Trực thuộc Tòa nhà">
            <Select placeholder="Chọn tòa nhà" allowClear style={{ borderRadius: 0 }}>
              {buildings.map(b => (
                <Option key={b.id} value={b.id}>{b.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Space style={{ display: 'flex', width: '100%' }} size="middle">
            <Form.Item name="floor" label="Tầng" style={{ flex: 1 }}>
              <Input placeholder="Ví dụ: 1, 2, Tầng 3" style={{ borderRadius: 0 }} />
            </Form.Item>
            <Form.Item name="phone_number" label="Số điện thoại" style={{ flex: 1 }}>
              <Input placeholder="Ví dụ: 0238 3855 452" style={{ borderRadius: 0 }} />
            </Form.Item>
          </Space>

          <Form.Item name="email" label="Email">
            <Input placeholder="Ví dụ: daotao@vinhuni.edu.vn" style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item name="working_hours" label="Giờ làm việc">
            <Input placeholder="Ví dụ: Sáng 7h30-11h30, Chiều 13h30-17h00" style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item name="function_description" label="Mô tả / Chức năng nhiệm vụ">
            <TextArea rows={3} placeholder="Mô tả các thủ tục hành chính, chức năng tiếp sinh viên..." style={{ borderRadius: 0 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL TÒA NHÀ */}
      <Modal
        title={editingBuilding ? "Chỉnh sửa Tòa nhà" : "Thêm mới Tòa nhà"}
        open={isBuildingModalVisible}
        onCancel={() => setIsBuildingModalVisible(false)}
        onOk={() => buildingForm.submit()}
        okText={editingBuilding ? "Lưu" : "Thêm"}
        cancelText="Hủy"
        okButtonProps={{ style: { borderRadius: 0, backgroundColor: 'var(--primary-blue)' } }}
        cancelButtonProps={{ style: { borderRadius: 0 } }}
        styles={{ content: { borderRadius: 0 } }}
      >
        <Form form={buildingForm} layout="vertical" onFinish={handleBuildingSubmit}>
          <Form.Item name="name" label="Tên Tòa nhà" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="Ví dụ: Nhà Điều hành" style={{ borderRadius: 0 }} />
          </Form.Item>

          <Form.Item name="code" label="Mã Tòa nhà (Mã định danh duy nhất)">
            <Input placeholder="Ví dụ: NHA_DIEU_HANH (bỏ trống hệ thống tự sinh)" style={{ borderRadius: 0 }} />
          </Form.Item>

          <Space style={{ display: 'flex', width: '100%' }} size="middle">
            <Form.Item name="latitude" label="Vĩ độ (Latitude)" rules={[{ required: true, message: 'Nhập vĩ độ' }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%', borderRadius: 0 }} step={0.0001} />
            </Form.Item>
            <Form.Item name="longitude" label="Kinh độ (Longitude)" rules={[{ required: true, message: 'Nhập kinh độ' }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%', borderRadius: 0 }} step={0.0001} />
            </Form.Item>
          </Space>

          <Form.Item name="total_floors" label="Tổng số tầng">
            <InputNumber min={1} max={50} style={{ width: '100%', borderRadius: 0 }} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả chung về Tòa nhà">
            <TextArea rows={3} placeholder="Mô tả vị trí, đặc điểm nhận dạng..." style={{ borderRadius: 0 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
