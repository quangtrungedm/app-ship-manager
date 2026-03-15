import { useState, useEffect } from 'react';
import { X, FileText, Printer, ChevronDown } from 'lucide-react';
import { Ship } from '../types';
import { PrintTemplate } from './PrintTemplate';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    ships: Ship[];
}

export function DocumentGeneratorModal({ isOpen, onClose, ships }: Props) {
    const [selectedShipId, setSelectedShipId] = useState<string>('');
    const [docType, setDocType] = useState<'khoi_luong' | 'ty_trong'>('khoi_luong');

    // Form fields
    const [vinconsRep, setVinconsRep] = useState('');
    const [securityRep, setSecurityRep] = useState('');
    const [materialName, setMaterialName] = useState('Cát Bơm');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [quantity, setQuantity] = useState('');
    const [totalWeight, setTotalWeight] = useState('');
    const [totalQuyDoi, setTotalQuyDoi] = useState('');
    const [words, setWords] = useState('');

    const [hocData, setHocData] = useState(
        Array(5).fill({ khongHang: '', coHang: '', hang: '', quyDoi: '' })
    );

    const activeShip = ships.find(s => s.id === selectedShipId);

    // Auto-fill total weight when ship selected
    useEffect(() => {
        if (activeShip) {
            setTotalWeight(activeShip.weight.toString());
            // Assume 1 chuyến by default for khoi_luong, 5 hộc for ty_trong
            setQuantity(docType === 'khoi_luong' ? '1' : '5');
        }
    }, [activeShip, docType]);

    if (!isOpen) return null;

    const handleHocChange = (index: number, field: string, value: string) => {
        const newData = [...hocData];
        newData[index] = { ...newData[index], [field]: value };
        setHocData(newData);
    };

    const handlePrint = () => {
        window.print();
    };

    // Prepare data for PrintTemplate
    const printData = {
        date: new Date(),
        vinconsRep,
        securityRep,
        materialName,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        quantity,
        totalWeight,
        shipName: activeShip?.name || '....................',
        hocData,
        totalQuyDoi,
        words
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 24, paddingBottom: 'env(safe-area-inset-bottom, 24px)'
        }}>
            <div className="fade-up" style={{
                background: '#fff', width: '100%', maxWidth: 1000, maxHeight: '90vh',
                borderRadius: 24, boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--c-surface)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(13, 148, 136, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} color="#0d9488" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--c-text)' }}>Khởi tạo Hồ sơ In</h2>
                            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', margin: 0, marginTop: 2 }}>Phiếu cân & Tỉ trọng tự động</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--c-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body (Form & Preview) */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* Form Left Side */}
                    <div style={{ width: '45%', padding: 24, borderRight: '1px solid #e2e8f0', overflowY: 'auto', background: '#f8fafc' }}>

                        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#475569' }}>Loại giấy tờ</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    className="input-field"
                                    value={docType}
                                    onChange={e => setDocType(e.target.value as any)}
                                    style={{ width: '100%', paddingLeft: 16, appearance: 'none', background: '#f8fafc' }}
                                >
                                    <option value="khoi_luong">Biên bản xác nhận Khối Lượng</option>
                                    <option value="ty_trong">Biên bản xác nhận Tỷ Trọng</option>
                                </select>
                                <ChevronDown size={18} color="#64748b" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#475569' }}>Tàu áp dụng (Tại VIN)</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    className="input-field"
                                    value={selectedShipId}
                                    onChange={e => setSelectedShipId(e.target.value)}
                                    style={{ width: '100%', paddingLeft: 16, appearance: 'none', background: '#f8fafc' }}
                                >
                                    <option value="" disabled>-- Chọn tàu --</option>
                                    {ships.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} - {s.weight.toLocaleString()} tấn</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} color="#64748b" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800 }}>Thông tin Cơ bản</h4>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Tên vật tư</label>
                                <input type="text" className="input-field" value={materialName} onChange={e => setMaterialName(e.target.value)} placeholder="Cát Bơm..." style={{ padding: '10px 14px' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Đại diện VINCONS</label>
                                    <input type="text" className="input-field" value={vinconsRep} onChange={e => setVinconsRep(e.target.value)} placeholder="Nhập tên..." style={{ padding: '10px 14px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Đại diện An Ninh</label>
                                    <input type="text" className="input-field" value={securityRep} onChange={e => setSecurityRep(e.target.value)} placeholder="Nhập tên..." style={{ padding: '10px 14px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Từ ngày (Bắt đầu)</label>
                                    <input type="datetime-local" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '10px 14px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Đến ngày (Kết thúc)</label>
                                    <input type="datetime-local" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '10px 14px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Số lượng {docType === 'khoi_luong' ? '(Chuyến)' : '(Hộc)'}</label>
                                    <input type="text" className="input-field" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ padding: '10px 14px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Tổng khối lượng (KG)</label>
                                    <input type="text" className="input-field" value={totalWeight} onChange={e => setTotalWeight(e.target.value)} style={{ padding: '10px 14px' }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800 }}>Dữ liệu Hộc (Tuỳ chọn)</h4>
                            {hocData.map((hoc, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input type="text" placeholder={`Hộc ${i + 1} rỗng`} className="input-field" value={hoc.khongHang} onChange={e => handleHocChange(i, 'khongHang', e.target.value)} style={{ padding: '8px 10px', fontSize: 13 }} />
                                    <input type="text" placeholder={`Có hàng`} className="input-field" value={hoc.coHang} onChange={e => handleHocChange(i, 'coHang', e.target.value)} style={{ padding: '8px 10px', fontSize: 13 }} />
                                    <input type="text" placeholder={`TL hàng`} className="input-field" value={hoc.hang} onChange={e => handleHocChange(i, 'hang', e.target.value)} style={{ padding: '8px 10px', fontSize: 13 }} />
                                </div>
                            ))}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Tổng Quy Đổi (M3)</label>
                                    <input type="text" className="input-field" value={totalQuyDoi} onChange={e => setTotalQuyDoi(e.target.value)} style={{ padding: '10px 14px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Viết bằng chữ</label>
                                    <input type="text" className="input-field" value={words} onChange={e => setWords(e.target.value)} style={{ padding: '10px 14px' }} />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Preview Right Side */}
                    <div style={{ flex: 1, padding: 24, background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                        <div style={{
                            width: '210mm', minHeight: '297mm', background: '#fff',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            transform: 'scale(0.85)', transformOrigin: 'top center',
                            marginBottom: -80, // Adjust for scale 
                        }}>
                            <PrintTemplate type={docType} data={printData} />
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={onClose} className="btn" style={{ padding: '12px 24px', borderRadius: 12 }}>Đóng</button>
                    <button
                        onClick={handlePrint}
                        disabled={!selectedShipId}
                        className="btn btn-primary"
                        style={{ padding: '12px 24px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <Printer size={18} /> In PDF ngay
                    </button>
                </div>
            </div>

            <style>
                {`
                    @media print {
                        .fade-up { display: none !important; }
                    }
                `}
            </style>
        </div>
    );
}
