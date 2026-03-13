import { useState } from 'react';
import { MobileLayout } from '../components/MobileLayout';
import { useShips } from '../lib/useShips';
import { useAuth } from '../lib/AuthContext';
import { DocumentGeneratorModal } from '../components/DocumentGeneratorModal';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DocumentEntry() {
    const { ships } = useShips();
    const { division } = useAuth();
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);

    // Only allow for VIN_CAN_GIO division per requirements
    const isVin = division === 'VIN_CAN_GIO';

    return (
        <MobileLayout>
            <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }} onClick={() => navigate('/login')}>
                    <button style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}>
                        <ArrowLeft size={24} color="var(--c-text)" />
                    </button>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Nhập liệu Giấy tờ</h2>
                </div>

                {!isVin ? (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 20, borderRadius: 16 }}>
                        <p style={{ color: '#b91c1c', margin: 0, fontWeight: 600, textAlign: 'center' }}>
                            Tính năng nhập liệu giấy tờ hiện chỉ hỗ trợ cho mảng VIN Cần Giờ.
                        </p>
                    </div>
                ) : (
                    <div>
                        <div style={{
                            background: '#fff', padding: 24, borderRadius: 24,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.04)', textAlign: 'center'
                        }} className="fade-up">
                            <div style={{ width: 64, height: 64, background: '#f0fdfa', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <FileText size={32} color="#0d9488" strokeWidth={2} />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px 0', color: '#111827' }}>Tạo Hồ Sơ Mới</h3>
                            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                                Tạo nhanh phiếu cân hàng, biên bản đo tỉ trọng cho các chuyến tàu đang hoạt động tại cảng VIN.
                            </p>
                            <button
                                onClick={() => setModalOpen(true)}
                                style={{
                                    width: '100%', padding: '16px', background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                                    color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    boxShadow: '0 8px 16px rgba(13, 148, 136, 0.25)'
                                }}
                            >
                                <FileText size={20} /> Bắt đầu Nhập liệu
                            </button>
                        </div>
                    </div>
                )}

                <DocumentGeneratorModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    ships={ships.filter(s => s.division === 'VIN_CAN_GIO')}
                />
            </div>
        </MobileLayout>
    );
}
