import React, { useState, useEffect } from 'react';
import { Tabs, Card, Typography, Select, Input, Button, message, Space, Spin, Row, Col, Tag } from 'antd';
import { getChatbotApiUrl } from '../../config/api';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;


const PROVIDERS_LIST = [
  { id: 'gemini', label: 'Google Gemini', color: '#4285f4', needsEndpoint: false },
  { id: 'openai', label: 'OpenAI GPT', color: '#10a37f', needsEndpoint: false },
  { id: 'groq', label: 'Groq Cloud', color: '#f97316', needsEndpoint: false },
  { id: 'vllm', label: 'vLLM Server', color: '#8b5cf6', needsEndpoint: true },
];

export default function ChatbotConfig() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0, color: 'var(--text-main)' }}>Cấu hình AI Chatbot</Title>
      </div>

      <Tabs 
        defaultActiveKey="slots" 
        items={[
          { key: 'slots', label: 'Phân công Nhiệm vụ (Slots)', children: <SlotsTab /> },
          { key: 'providers', label: 'Cấu hình API Keys (Providers)', children: <ProvidersTab /> }
        ]}
      />
    </div>
  );
}

// ==========================================
// TAB 1: SLOTS
// ==========================================
function SlotsTab() {
  const [selectedProviders, setSelectedProviders] = useState({ ocr: 'gemini', chat: 'gemini' });
  const [selectedModels, setSelectedModels] = useState({ ocr: '', chat: '' });
  const [modelsList, setModelsList] = useState({ ocr: [], chat: [] });
  const [modelsLoading, setModelsLoading] = useState({ ocr: false, chat: false });
  const [slotsLoading, setSlotsLoading] = useState(false);

  const loadSlots = async () => {
    try {
      const slotsRes = await fetch(`${getChatbotApiUrl()}/admin/slots`);
      if (slotsRes.ok) {
        const data = await slotsRes.json();
        const ocrSlot = data.find(s => s.slot === 'ocr');
        const chatSlot = data.find(s => s.slot === 'chat');
        let ocrProv = selectedProviders.ocr;
        let chatProv = selectedProviders.chat;

        if (ocrSlot) {
          ocrProv = ocrSlot.provider;
          setSelectedProviders(prev => ({ ...prev, ocr: ocrProv }));
          setSelectedModels(prev => ({ ...prev, ocr: ocrSlot.model_name }));
        }
        if (chatSlot) {
          chatProv = chatSlot.provider;
          setSelectedProviders(prev => ({ ...prev, chat: chatProv }));
          setSelectedModels(prev => ({ ...prev, chat: chatSlot.model_name }));
        }

        // Sau khi lấy được provider (hoặc mặc định), mới gọi API lấy danh sách models
        handleLoadModelsForSlot('ocr', ocrProv);
        handleLoadModelsForSlot('chat', chatProv);
      }
    } catch (err) {
      message.error('Lỗi tải cấu hình Slots từ Chatbot API.');
    }
  };

  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      loadSlots();
      hasFetched.current = true;
    }
  }, []);

  const handleLoadModelsForSlot = async (slotType, forceProvider = null) => {
    const provider = forceProvider || selectedProviders[slotType];
    setModelsLoading(prev => ({ ...prev, [slotType]: true }));
    try {
      const res = await fetch(`${getChatbotApiUrl()}/admin/models/${provider}`);
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setModelsList(prev => ({ ...prev, [slotType]: data.models }));
          message.success(`Đã lấy thành công ${data.models.length} models của ${provider.toUpperCase()}.`);
        } else {
          setModelsList(prev => ({ ...prev, [slotType]: [] }));
          message.info(`Vui lòng nhập tên model thủ công cho ${provider.toUpperCase()}.`);
        }
      } else {
        const errData = await res.json();
        message.error(errData.detail || `Kết nối tới ${provider} thất bại.`);
      }
    } catch (err) {
      message.error(`Không kết nối được tới provider API.`);
    } finally {
      setModelsLoading(prev => ({ ...prev, [slotType]: false }));
    }
  };

  // Đã xóa useEffect thừa gây ra gửi 4 requests lúc mount

  const handleSaveSlot = async (slotType) => {
    const provider = selectedProviders[slotType];
    const model = selectedModels[slotType]?.trim();

    if (!model) {
      message.warning('Vui lòng chọn hoặc nhập tên model.');
      return;
    }

    setSlotsLoading(true);
    try {
      const res = await fetch(`${getChatbotApiUrl()}/admin/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot: slotType,
          provider,
          model_name: model
        })
      });


      if (res.ok) {
        message.success(`Đã lưu phân công slot "${slotType.toUpperCase()}" thành công.`);
      } else {
        const data = await res.json();
        message.error(data.detail || 'Lỗi cập nhật slot configuration.');
      }
    } catch (err) {
      message.error('Lỗi kết nối lưu slot.');
    } finally {
      setSlotsLoading(false);
    }
  };

  return (
    <Row gutter={[24, 24]}>
      {/* SLOT OCR */}
      <Col xs={24} md={12}>
        <Card 
          title={<><span style={{ color: 'var(--primary-blue)', fontSize: '0.8rem', marginRight: '8px' }}>SLOT 1</span> 📄 OCR (Đọc & trích xuất PDF)</>} 
          variant="outlined" 
          style={{ borderRadius: 0, borderColor: 'var(--border-color)', backgroundColor: '#f8fafc' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>CHỌN PROVIDER</div>
              <Select
                value={selectedProviders.ocr}
                onChange={val => {
                  setSelectedProviders(prev => ({ ...prev, ocr: val }));
                  handleLoadModelsForSlot('ocr', val);
                }}
                style={{ width: '100%', borderRadius: 0 }}
              >
                {PROVIDERS_LIST.map(p => <Option key={p.id} value={p.id}>{p.label}</Option>)}
              </Select>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>MODEL NAME</div>
              {selectedProviders.ocr === 'vllm' ? (
                <Input
                  placeholder="Ví dụ: Qwen/Qwen2.5-32B-Instruct"
                  value={selectedModels.ocr}
                  onChange={e => setSelectedModels(prev => ({ ...prev, ocr: e.target.value }))}
                  style={{ borderRadius: 0 }}
                />
              ) : (
                <Spin spinning={modelsLoading.ocr} size="small">
                  <Select
                    value={selectedModels.ocr}
                    onChange={val => setSelectedModels(prev => ({ ...prev, ocr: val }))}
                    style={{ width: '100%', borderRadius: 0 }}
                    disabled={modelsLoading.ocr}
                  >
                    <Option value="">-- Chọn Model --</Option>
                    {modelsList.ocr.map(m => (
                      <Option key={m} value={m}>{m}</Option>
                    ))}
                    {selectedModels.ocr && !modelsList.ocr.includes(selectedModels.ocr) && (
                      <Option value={selectedModels.ocr}>{selectedModels.ocr} (đang sử dụng)</Option>
                    )}
                  </Select>
                </Spin>
              )}
            </div>

            <Button
              type="primary"
              onClick={() => handleSaveSlot('ocr')}
              loading={slotsLoading}
              style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)', width: '100%', marginTop: '8px', fontWeight: 'bold' }}
            >
              LƯU CẤU HÌNH OCR
            </Button>
          </Space>
        </Card>
      </Col>

      {/* SLOT CHAT */}
      <Col xs={24} md={12}>
        <Card 
          title={<><span style={{ color: 'var(--primary-blue)', fontSize: '0.8rem', marginRight: '8px' }}>SLOT 2</span> 💬 Chat (Suy luận RAG)</>} 
          variant="outlined" 
          style={{ borderRadius: 0, borderColor: 'var(--border-color)', backgroundColor: '#f8fafc' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>CHỌN PROVIDER</div>
              <Select
                value={selectedProviders.chat}
                onChange={val => {
                  setSelectedProviders(prev => ({ ...prev, chat: val }));
                  handleLoadModelsForSlot('chat', val);
                }}
                style={{ width: '100%', borderRadius: 0 }}
              >
                {PROVIDERS_LIST.map(p => <Option key={p.id} value={p.id}>{p.label}</Option>)}
              </Select>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>MODEL NAME</div>
              {selectedProviders.chat === 'vllm' ? (
                <Input
                  placeholder="Ví dụ: Qwen/Qwen2.5-32B-Instruct"
                  value={selectedModels.chat}
                  onChange={e => setSelectedModels(prev => ({ ...prev, chat: e.target.value }))}
                  style={{ borderRadius: 0 }}
                />
              ) : (
                <Spin spinning={modelsLoading.chat} size="small">
                  <Select
                    value={selectedModels.chat}
                    onChange={val => setSelectedModels(prev => ({ ...prev, chat: val }))}
                    style={{ width: '100%', borderRadius: 0 }}
                    disabled={modelsLoading.chat}
                  >
                    <Option value="">-- Chọn Model --</Option>
                    {modelsList.chat.map(m => (
                      <Option key={m} value={m}>{m}</Option>
                    ))}
                    {selectedModels.chat && !modelsList.chat.includes(selectedModels.chat) && (
                      <Option value={selectedModels.chat}>{selectedModels.chat} (đang sử dụng)</Option>
                    )}
                  </Select>
                </Spin>
              )}
            </div>

            <Button
              type="primary"
              onClick={() => handleSaveSlot('chat')}
              loading={slotsLoading}
              style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)', width: '100%', marginTop: '8px', fontWeight: 'bold' }}
            >
              LƯU CẤU HÌNH CHAT
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

// ==========================================
// TAB 2: PROVIDERS
// ==========================================
function ProvidersTab() {
  const [providersData, setProvidersData] = useState([]);
  const [providerKeys, setProviderKeys] = useState({ gemini: '', openai: '', groq: '', vllm: '' });
  const [providerEndpoints, setProviderEndpoints] = useState({ vllm: '' });
  const [provLoading, setProvLoading] = useState(false);

  const loadProviders = async () => {
    try {
      const provRes = await fetch(`${getChatbotApiUrl()}/admin/providers`);
      if (provRes.ok) {
        const data = await provRes.json();
        setProvidersData(data);
        const vllmProv = data.find(p => p.provider === 'vllm');
        if (vllmProv && vllmProv.endpoint) {
          setProviderEndpoints(prev => ({ ...prev, vllm: vllmProv.endpoint }));
        }
      }
    } catch (err) {
      message.error('Lỗi tải cấu hình API keys từ Chatbot API.');
    }
  };

  const hasFetchedProv = React.useRef(false);

  useEffect(() => {
    if (!hasFetchedProv.current) {
      loadProviders();
      hasFetchedProv.current = true;
    }
  }, []);

  const handleSaveProvider = async (providerId) => {
    const key = providerKeys[providerId]?.trim();
    const endpoint = PROVIDERS_LIST.find(p => p.id === providerId).needsEndpoint
      ? providerEndpoints[providerId]?.trim()
      : null;

    setProvLoading(true);
    try {
      const res = await fetch(`${getChatbotApiUrl()}/admin/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          api_key: key || null,
          endpoint: endpoint || null,
          is_active: true
        })
      });


      if (res.ok) {
        message.success(`Đã cập nhật cấu hình cho ${providerId.toUpperCase()}.`);
        setProviderKeys(prev => ({ ...prev, [providerId]: '' }));
        await loadProviders();
      } else {
        const data = await res.json();
        message.error(data.detail || 'Lỗi cập nhật credentials.');
      }
    } catch (err) {
      message.error('Lỗi mạng, không lưu được credentials.');
    } finally {
      setProvLoading(false);
    }
  };

  return (
    <Row gutter={[24, 24]}>
      {PROVIDERS_LIST.map((provider) => {
        const dbInfo = providersData.find(p => p.provider === provider.id) || {};
        return (
          <Col xs={24} md={12} key={provider.id}>
            <Card
              variant="outlined"
              style={{ borderRadius: 0, borderColor: 'var(--border-color)', backgroundColor: '#f8fafc' }}
              title={<span style={{ color: provider.color }}>{provider.label}</span>}
              extra={
                dbInfo.has_key 
                  ? <Tag color="success" style={{ borderRadius: 0 }}><CheckCircleOutlined /> ĐÃ THIẾT LẬP KEY</Tag>
                  : <Tag color="default" style={{ borderRadius: 0 }}><CloseCircleOutlined /> CHƯA CÓ KEY</Tag>
              }
            >
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                {provider.needsEndpoint && (
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>VLLM SERVER URL ENDPOINT</div>
                    <Input
                      placeholder="Ví dụ: http://10.0.0.5:8080"
                      value={providerEndpoints[provider.id] || ''}
                      onChange={e => setProviderEndpoints(prev => ({ ...prev, [provider.id]: e.target.value }))}
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    API KEY {dbInfo.has_key && '(Nhập mới nếu muốn thay đổi khóa cũ)'}
                  </div>
                  <Input.Password
                    placeholder="••••••••••••••••"
                    value={providerKeys[provider.id]}
                    onChange={e => setProviderKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                    style={{ borderRadius: 0 }}
                  />
                </div>

                <Button
                  type="primary"
                  onClick={() => handleSaveProvider(provider.id)}
                  loading={provLoading}
                  style={{ borderRadius: 0, backgroundColor: 'var(--primary-blue)', width: '100%', marginTop: '8px', fontWeight: 'bold' }}
                >
                  LƯU CREDENTIALS
                </Button>
              </Space>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
