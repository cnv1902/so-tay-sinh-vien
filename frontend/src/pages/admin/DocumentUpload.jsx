import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Select, Upload, Button, Typography, Alert, Table, Space, Tag, message, Input, Modal, Popconfirm } from 'antd';
import { InboxOutlined, FileTextOutlined, ArrowRightOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getChatbotApiUrl, getMainApiUrl } from '../../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

const DOC_TYPE_OPTIONS = [
    { value: 'de_an', label: '📄 Đề án tuyển sinh' },
    { value: 'quy_che', label: '🛡️ Quy chế' },
    { value: 'diem_chuan', label: '📊 Điểm chuẩn' },
    { value: 'huong_dan', label: '🧭 Hướng dẫn' },
    { value: 'hoc_phi', label: '💰 Học phí' },
    { value: 'doi_song', label: '👥 Đời sống SV' },
    { value: 'co_so_vat_chat', label: '🏢 Cơ sở vật chất' },
    { value: 'thanh_tich', label: '🏆 Thành tích' },
    { value: 'gioi_thieu', label: 'ℹ️ Giới thiệu' },
    { value: 'lich_su', label: '⏳ Lịch sử' },
    { value: 'khac', label: '📁 Khác' },
];

const DocumentUpload = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [polling, setPolling] = useState(false);

    // Trạng thái cho modal đổi tên
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [renamingDoc, setRenamingDoc] = useState(null);
    const [newName, setNewName] = useState('');

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('access_token');
            // Nguồn dữ liệu chính xác: backend (8000) — đồng bộ cả chatbot status
            const res = await fetch(`${getMainApiUrl()}/api/admin/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);

                // Polling khi có doc đang xử lý (bất kỳ trạng thái trung gian nào)
                const inProgressStatuses = ['processing', 'pending_review', 'embedding'];
                const hasInProgress = data.some(doc => inProgressStatuses.includes(doc.status));
                if (hasInProgress && !polling) {
                    setPolling(true);
                } else if (!hasInProgress && polling) {
                    setPolling(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        let interval;
        if (polling) {
            interval = setInterval(() => {
                fetchDocuments();
            }, 2000); // Giảm xuống 2s để trạng thái cập nhật nhanh hơn
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [polling]);


    const handleUpload = async (values) => {
        if (!values.file || values.file.length === 0) {
            message.error('Vui lòng chọn một file tài liệu!');
            return;
        }

        const formData = new FormData();
        formData.append('file', values.file[0].originFileObj);
        formData.append('year', values.year);
        formData.append('doc_type', values.doc_type || 'khac');
        if (values.custom_filename) {
            formData.append('custom_filename', values.custom_filename);
        }

        setUploading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${getChatbotApiUrl()}/api/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                message.success('Upload thành công! Hệ thống đang xử lý và trích xuất tài liệu...');
                form.resetFields();
                fetchDocuments();
                setPolling(true);
            } else {
                const err = await res.json();
                message.error(err.detail || 'Upload thất bại');
            }
        } catch (error) {
            message.error('Lỗi mạng khi upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${getChatbotApiUrl()}/api/documents/${docId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                message.success('Đã xóa tài liệu');
                fetchDocuments();
            } else {
                message.error('Xóa tài liệu thất bại');
            }
        } catch (error) {
            message.error('Lỗi khi xóa tài liệu');
        }
    };

    const openRenameModal = (doc) => {
        setRenamingDoc(doc);
        setNewName(doc.filename);
        setRenameModalVisible(true);
    };

    const handleRename = async () => {
        if (!newName || !newName.trim()) {
            message.error("Tên không được để trống");
            return;
        }
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${getChatbotApiUrl()}/api/documents/${renamingDoc.id}/rename`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ new_name: newName })
            });
            if (res.ok) {
                const data = await res.json();
                message.success(data.message);
                setRenameModalVisible(false);
                fetchDocuments();
            } else {
                message.error("Đổi tên thất bại");
            }
        } catch (error) {
            message.error("Lỗi mạng");
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Tên file', dataIndex: 'filename', key: 'filename' },
        { title: 'Năm phát hành', dataIndex: 'year', key: 'year', width: 120 },
        { 
            title: 'Loại', 
            dataIndex: 'doc_type', 
            key: 'doc_type', 
            width: 160,
            render: (type) => {
                const opt = DOC_TYPE_OPTIONS.find(o => o.value === type);
                return <Tag color="blue">{opt ? opt.label : type}</Tag>;
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                if (status === 'processing') return <Tag color="processing">Đang xử lý</Tag>;
                if (status === 'pending_review') return <Tag color="warning">Chờ duyệt chunks</Tag>;
                if (status === 'embedding') return <Tag color="processing">Đang đẩy lên Qdrant</Tag>;
                if (status === 'success') return <Tag color="success">Hoàn thành</Tag>;
                if (status === 'failed') return <Tag color="error">Lỗi xử lý</Tag>;
                return <Tag>{status}</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {record.status === 'pending_review' && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<ArrowRightOutlined />}
                            onClick={() => navigate(`/admin/documents/${record.id}/review`)}
                        >
                            Duyệt Chunks
                        </Button>
                    )}
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openRenameModal(record)}
                    >
                        Đổi tên
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa tài liệu này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e && e.fileList;
    };

    return (
        <div style={{ padding: '24px', background: 'var(--surface-color)', minHeight: '100%' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Title level={4} style={{ color: 'var(--text-main)', marginBottom: '8px' }}>
                    Upload & Quản lý Tài liệu Tuyển sinh (RAG)
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                    Tải lên các tài liệu đề án, quy chế hoặc bảng điểm chuẩn dạng PDF/DOCX/TXT. Hệ thống sẽ tự động chuyển đổi sang Markdown và chuẩn bị dữ liệu cho AI & Sổ tay.
                </Text>

                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpload}
                        initialValues={{ year: new Date().getFullYear(), doc_type: 'de_an' }}
                    >
                        <Form.Item
                            name="file"
                            label="Chọn tệp tài liệu"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                            rules={[{ required: true, message: 'Vui lòng chọn một file để upload!' }]}
                        >
                            <Upload.Dragger
                                name="file"
                                beforeUpload={() => false}
                                maxCount={1}
                                accept=".pdf,.docx,.txt"
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined style={{ color: '#1890ff', fontSize: '48px' }} />
                                </p>
                                <p className="ant-upload-text" style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                    Kéo thả file tài liệu vào đây hoặc click để duyệt
                                </p>
                                <p className="ant-upload-hint" style={{ color: 'var(--text-muted)' }}>
                                    Hỗ trợ file định dạng DOCX, PDF chứa văn bản, TXT.
                                </p>
                            </Upload.Dragger>
                        </Form.Item>

                        <Form.Item name="custom_filename" label="Tên tài liệu tùy chỉnh (Để trống sẽ tự lấy tên file gốc)">
                            <Input placeholder="Ví dụ: Quy chế tuyển sinh ĐH Vinh 2024" />
                        </Form.Item>

                        <Space size="large" style={{ marginTop: '8px' }}>
                            <Form.Item name="year" label="Năm phát hành" rules={[{ required: true, message: 'Vui lòng nhập năm phát hành' }]}>
                                <InputNumber min={2020} max={2030} style={{ width: 180 }} placeholder="Ví dụ: 2024" />
                            </Form.Item>

                            <Form.Item name="doc_type" label="Loại tài liệu">
                                <Select style={{ width: 250 }}>
                                    {DOC_TYPE_OPTIONS.map(opt => (
                                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item label=" ">
                                <Button type="primary" htmlType="submit" loading={uploading} icon={<FileTextOutlined />}>
                                    Upload và Xử lý
                                </Button>
                            </Form.Item>
                        </Space>
                    </Form>
                </div>

                {documents.some(d => d.status === 'failed') && (
                    <Alert
                        message="Cảnh báo: Có tài liệu bị lỗi"
                        description={documents.find(d => d.status === 'failed')?.error_message || "Đã xảy ra lỗi khi xử lý."}
                        type="error"
                        showIcon
                        style={{ marginBottom: '24px' }}
                    />
                )}

                <Table
                    columns={columns}
                    dataSource={documents}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    bordered
                    size="middle"
                />
            </div>

            <Modal
                title="Sửa tên tài liệu"
                visible={renameModalVisible}
                onOk={handleRename}
                onCancel={() => setRenameModalVisible(false)}
                okText="Lưu lại"
                cancelText="Hủy"
            >
                <Input 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="Nhập tên tài liệu mới..."
                />
            </Modal>
        </div>
    );
};

export default DocumentUpload;
