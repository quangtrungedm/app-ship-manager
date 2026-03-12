import { useState, useEffect } from 'react';
import { X, FileText, Printer, ChevronDown, Check, Loader2 } from 'lucide-react';
import { Ship } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    ships: Ship[];
}

export function DocumentGeneratorModal({ isOpen, onClose, ships }: Props) {
    const [selectedShipId, setSelectedShipId] = useState('');
    const [docType, setDocType] = useState('phieu_can');
    const [driverName, setDriverName] = useState('');
    const [truckPlate, setTruckPlate] = useState('');
    const [actualWeight, setActualWeight] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl] = useState<string | null>(null); // TODO: setPreviewUrl when generating PDF

    const activeShip = ships.find(s => s.id === selectedShipId);

    // Auto-fill actual weight from ship if available
    useEffect(() => {
        if (activeShip) {
            setActualWeight(activeShip.weight.toString());
        } else {
            setActualWeight('');
        }
    }, [activeShip]);

    if (!isOpen) return null;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);

        // TODO: Integrate pdf-lib here when the user uploads the template
        // await new Promise(r => setTimeout(r, 1500)); // Simulate generation

        setIsGenerating(false);
        alert('Tính năng nhúng font và tạo PDF đang chờ bạn tải lên file PDF mẫu. Hãy quay lại chat để gửi file nhé!');
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-sheet" style={{ display: 'flex', flexDirection: 'column', height: '90dvh', padding: 0 }}>
                {/* Header */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={18} color="#3b82f6" strokeWidth={2.5} />
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>In Hồ Sơ / Giấy Tờ</h2>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={18} color="#64748b" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Form Body */}
                <form id="doc-form" onSubmit={handleGenerate} style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    <div className="field">
                        <label>Loại giấy tờ</label>
                        <div style={{ position: 'relative' }}>
                            <select value={docType} onChange={e => setDocType(e.target.value)} style={{ appearance: 'none', background: '#fff' }}>
                                <option value="phieu_can">Phiếu cân hàng / Tỉ trọng</option>
                                <option value="bien_ban">Biên bản nghiệm thu</option>
                            </select>
                            <ChevronDown size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: 16, pointerEvents: 'none' }} strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="field">
                        <label>Chọn chuyến tàu (Lấy dữ liệu gốc)</label>
                        <div style={{ position: 'relative' }}>
                            <select value={selectedShipId} onChange={e => setSelectedShipId(e.target.value)} required style={{ appearance: 'none', background: '#fff' }}>
                                <option value="" disabled>-- Chọn tàu để điền dữ liệu --</option>
                                {ships.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} - {new Date(s.arrivalDate).toLocaleDateString('vi-VN')} ({s.weight} tấn)</option>
                                ))}
                            </select>
                            <ChevronDown size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: 16, pointerEvents: 'none' }} strokeWidth={2.5} />
                        </div>
                    </div>

                    {activeShip && (
                        <div className="fade-up" style={{ background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Dữ liệu tự động (Auto-fill)</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                                <div>
                                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>Tên tàu</p>
                                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{activeShip.name}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>Ngày vào</p>
                                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{new Date(activeShip.arrivalDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>Khối lượng (Tấn)</p>
                                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{activeShip.weight.toLocaleString('vi-VN')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="field">
                        <label>Thông tin bổ sung (Tuỳ chọn)</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input
                                placeholder="Tên tài xế/Người nhận..."
                                value={driverName} onChange={e => setDriverName(e.target.value)}
                            />
                            <input
                                placeholder="Biển số xe..."
                                value={truckPlate} onChange={e => setTruckPlate(e.target.value)}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input
                                    type="number"
                                    placeholder="Tỉ trọng / Cân thực tế..."
                                    value={actualWeight} onChange={e => setActualWeight(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Tấn</span>
                            </div>
                        </div>
                    </div>

                    {previewUrl && (
                        <div style={{ marginTop: 20, textAlign: 'center' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Check size={16} strokeWidth={3} /> Đã có bản xem trước
                            </p>
                            <a href={previewUrl} target="_blank" rel="noreferrer" className="btn" style={{ background: '#f1f5f9', color: '#0f172a', width: '100%' }}>
                                Mở / Tải file PDF
                            </a>
                        </div>
                    )}
                </form>

                {/* Footer Action */}
                <div style={{ padding: 20, borderTop: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
                    <button
                        type="submit"
                        form="doc-form"
                        disabled={!selectedShipId || isGenerating}
                        className="btn btn-primary btn-block btn-lg"
                        style={{ opacity: !selectedShipId || isGenerating ? 0.7 : 1 }}
                    >
                        {isGenerating ? <Loader2 size={20} className="spin" /> : <Printer size={20} />}
                        Xem trước & In PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
