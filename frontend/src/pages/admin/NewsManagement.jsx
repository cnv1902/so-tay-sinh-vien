import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Checkbox, Popconfirm, message, Tag, Space, Typography, Tabs, Upload, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { getMainApiUrl } from '../../config/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const { Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

export default function NewsManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const quillRef = useRef(null);
  const [editorImageModalVisible, setEditorImageModalVisible] = useState(false);
  const [editorImageUrl, setEditorImageUrl] = useState("");
  const coverImageUrl = Form.useWatch('image_url', form);

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
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: () => {
          setEditorImageUrl("");
          setEditorImageModalVisible(true);
        }
      }
    }
  }), []);
  
  const apiUrl = `${getMainApiUrl()}/api/admin/news`;

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
    // Tạm thời hardcode author_id = 1 cho demo (cần lấy từ token khi hoàn thiện Auth)
    const payload = { ...values, author_id: values.author_id || 1 };
    
    try {
      const url = editingRecord ? `${apiUrl}/${editingRecord.id}` : apiUrl;
      const method = editingRecord ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Thao tác thất bại');
      
      message.success(editingRecord ? 'Cập nhật tin tức thành công' : 'Thêm tin tức thành công');
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
      message.success('Xóa tin tức thành công');
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Tác giả (ID)',
      dataIndex: 'author_id',
      key: 'author_id',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_pinned',
      key: 'is_pinned',
      render: (pinned) => (
        pinned 
          ? <Tag color="var(--primary-blue)" style={{ borderRadius: 0 }}>Đã ghim</Tag> 
          : <Tag style={{ borderRadius: 0 }}>Bình thường</Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
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
            title="Bạn có chắc chắn muốn xóa bài viết này?"
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
        <Title level={4} style={{ margin: 0, color: 'var(--text-main)' }}>Quản lý Tin tức & Bài viết</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => openModal()}
          style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)' }}
        >
          Thêm tin tức
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
        components={{
            header: {
                cell: (props) => <th {...props} style={{...props.style, borderRadius: 0}} />
            }
        }}
      />

      <Modal
        title={editingRecord ? 'Cập nhật tin tức' : 'Thêm tin tức mới'}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingRecord ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Hủy"
        width="80vw"
        style={{ top: '5vh' }}
        okButtonProps={{ style: { borderRadius: 0, backgroundColor: 'var(--primary-blue)' } }}
        cancelButtonProps={{ style: { borderRadius: 0 } }}
        styles={{ 
          content: { borderRadius: 0 },
          body: { height: '75vh', overflowY: 'auto', paddingRight: '8px' }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ is_pinned: false }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề bài viết"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề" style={{ borderRadius: 0 }} />
          </Form.Item>
          
          <Form.Item label="Ảnh bìa" style={{ marginBottom: 24 }}>
            <Tabs defaultActiveKey="url" items={[
              {
                key: 'url',
                label: 'Nhập URL',
                children: (
                  <>
                    <Form.Item name="image_url" noStyle>
                      <Input placeholder="https://example.com/image.jpg" style={{ borderRadius: 0 }} />
                    </Form.Item>
                    {coverImageUrl && (
                      <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Ảnh xem trước:</Typography.Text>
                        <Image 
                          src={coverImageUrl} 
                          alt="Preview" 
                          style={{ maxHeight: 200, objectFit: 'contain' }}
                          fallback="https://via.placeholder.com/300x200?text=Lỗi+tải+ảnh"
                        />
                      </div>
                    )}
                  </>
                )
              },
              {
                key: 'upload',
                label: 'Tải ảnh lên',
                children: (
                  <Dragger 
                    name="file"
                    multiple={false}
                    showUploadList={false}
                    customRequest={async ({ file, onSuccess, onError }) => {
                      const formData = new FormData();
                      formData.append("file", file);
                      try {
                        const res = await fetch(`${getMainApiUrl()}/api/admin/upload`, {
                          method: "POST",
                          body: formData
                        });
                        const data = await res.json();
                        if (res.ok) {
                          form.setFieldsValue({ image_url: data.url });
                          message.success("Tải ảnh bìa thành công");
                          onSuccess("ok");
                        } else throw new Error(data.detail);
                      } catch (err) {
                        message.error("Lỗi tải ảnh bìa");
                        onError(err);
                      }
                    }}
                  >
                    <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                    <p className="ant-upload-text">Kéo thả ảnh hoặc click để tải lên</p>
                  </Dragger>
                )
              }
            ]} />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <ReactQuill ref={quillRef} theme="snow" modules={modules} placeholder="Nhập nội dung bài viết..." style={{ height: '45vh', marginBottom: '40px' }} />
          </Form.Item>

          <Form.Item
            name="is_pinned"
            valuePropName="checked"
          >
            <Checkbox style={{ borderRadius: 0 }}>Ghim bài viết lên đầu</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chèn ảnh vào bài viết"
        open={editorImageModalVisible}
        onCancel={() => setEditorImageModalVisible(false)}
        onOk={() => {
          if (editorImageUrl) {
            const editor = quillRef.current.getEditor();
            editor.focus();
            const range = editor.getSelection(true) || { index: editor.getLength() };
            editor.insertEmbed(range.index, 'image', editorImageUrl);
            editor.setSelection(range.index + 1);
            setEditorImageModalVisible(false);
          }
        }}
        okText="Chèn bằng URL"
      >
        <Tabs defaultActiveKey="url" items={[
          {
            key: 'url',
            label: 'Nhập URL',
            children: (
              <Input 
                value={editorImageUrl}
                onChange={(e) => setEditorImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg" 
              />
            )
          },
          {
            key: 'upload',
            label: 'Tải ảnh lên',
            children: (
              <Dragger 
                name="file"
                multiple={false}
                showUploadList={false}
                customRequest={async ({ file, onSuccess, onError }) => {
                  const formData = new FormData();
                  formData.append("file", file);
                  try {
                    message.loading({ content: 'Đang tải ảnh...', key: 'uploadEditorImage' });
                    const res = await fetch(`${getMainApiUrl()}/api/admin/upload`, {
                      method: "POST",
                      body: formData
                    });
                    const data = await res.json();
                    if (res.ok) {
                      const editor = quillRef.current.getEditor();
                      editor.focus();
                      const range = editor.getSelection(true) || { index: editor.getLength() };
                      editor.insertEmbed(range.index, 'image', data.url);
                      editor.setSelection(range.index + 1);
                      message.success({ content: 'Ảnh đã được chèn', key: 'uploadEditorImage' });
                      onSuccess("ok");
                      setEditorImageModalVisible(false);
                    } else throw new Error(data.detail);
                  } catch (err) {
                    message.error({ content: 'Lỗi tải ảnh', key: 'uploadEditorImage' });
                    onError(err);
                  }
                }}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">Kéo thả ảnh hoặc click để tải lên</p>
              </Dragger>
            )
          }
        ]} />
      </Modal>

      <style>{`
        .ql-editor img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}
