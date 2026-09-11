import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShips } from '../lib/useShips';
import { Ship, ShipStatus } from '../types';
import { STANDARD_PORTS, STANDARD_CLIENTS } from '../lib/constants';
import {
    ArrowLeft, Search, Star, Coffee, ClipboardCheck,
    Save, CheckCircle2, RotateCcw, Ship as ShipIcon,
    Clock, PlusCircle
} from 'lucide-react';

const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const formatVNCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/\D/g, '')) || 0 : val;
    return num.toLocaleString('vi-VN');
};

const formatVNWeight = (value: string) => {
    let cleaned = value.replace(/[^0-9.,]/g, '');
    if (cleaned.endsWith('.') && !cleaned.slice(0, -1).includes(',')) {
        cleaned = cleaned.slice(0, -1) + ',';
    }
    let normalized = cleaned.replace(/\./g, '');
    const parts = normalized.split(',');
    let intPart = parts[0];
    let decPart = parts.length > 1 ? ',' + parts.slice(1).join('') : '';
    if (intPart.length > 1 && intPart.startsWith('0')) {
        intPart = intPart.replace(/^0+/, '');
        if (intPart === '') intPart = '0';
    }
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return intPart + decPart;
};

const STAR_LABELS: Record<number, { text: string; color: string; bg: string }> = {
    1: { text: 'Kém / Phát sinh sự cố', color: '#dc2626', bg: '#fef2f2' },
    2: { text: 'Chậm / Khó làm hàng', color: '#ea580c', bg: '#fff7ed' },
    3: { text: 'Bình thường / Tạm ổn', color: '#ca8a04', bg: '#fefce8' },
    4: { text: 'Tốt / Thuận lợi', color: '#16a34a', bg: '#f0fdf4' },
    5: { text: 'Rất tốt / Nhanh chóng', color: '#2563eb', bg: '#eff6ff' },
};

const QUICK_CAFE_AMOUNTS = [50000, 100000, 200000, 500000];
const QUICK_TALLY_AMOUNTS = [100000, 200000, 300000, 500000];

export function ShipQuickUpdate() {
    const navigate = useNavigate();
    const { ships, updateShip, addShip } = useShips();

    // Mode: 'create' (Nhập tàu mới) | 'update' (Tìm & cập nhật tàu có sẵn)
    const [mode, setMode] = useState<'create' | 'update'>('create');

    // Ship Search & Selection State (for 'update' mode)
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedShip, setSelectedShip] = useState<Ship | null>(null);

    // Form fields for ship details
    const [shipNameInput, setShipNameInput] = useState('');
    const [status, setStatus] = useState<ShipStatus>('waiting');
    const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
    const [completionDate, setCompletionDate] = useState('');
    const [weightInput, setWeightInput] = useState('');
    const [port, setPort] = useState<string>('Sowatco Long Bình');
    const [customPort, setCustomPort] = useState('');
    const [client, setClient] = useState<string>('Hoà Phát');
    const [customClient, setCustomClient] = useState('');
    const [hasBarge, setHasBarge] = useState(false);
    const [bargeCount, setBargeCount] = useState(1);

    // Evaluation & operational costs
    const [rating, setRating] = useState<number>(0);
    const [ratingComment, setRatingComment] = useState('');
    const [hasCafeFee, setHasCafeFee] = useState(false);
    const [cafeFee, setCafeFee] = useState<number>(0);
    const [cafeNote, setCafeNote] = useState('');
    const [hasTally, setHasTally] = useState(false);
    const [tallyFee, setTallyFee] = useState<number>(0);
    const [tallyNote, setTallyNote] = useState('');

    // Feedback State
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

    // Filter ships for autocomplete
    const suggestedShips = useMemo(() => {
        if (!searchQuery.trim()) return ships.slice(0, 8);
        const q = removeAccents(searchQuery.toLowerCase().trim());
        return ships.filter(s =>
            removeAccents(s.name.toLowerCase()).includes(q)
            || (s.port && removeAccents(s.port.toLowerCase()).includes(q))
            || (s.client && removeAccents(s.client.toLowerCase()).includes(q))
        ).slice(0, 8);
    }, [ships, searchQuery]);

    // Fill form when selecting a ship in 'update' mode
    const handleSelectShip = (ship: Ship) => {
        setSelectedShip(ship);
        setShipNameInput(ship.name);
        setSearchQuery(ship.name);
        setIsDropdownOpen(false);

        // Fill ship details
        setStatus(ship.status || 'waiting');
        setArrivalDate(ship.arrivalDate ? ship.arrivalDate.split('T')[0] : new Date().toISOString().split('T')[0]);
        setCompletionDate(ship.completionDate ? ship.completionDate.split('T')[0] : '');
        setWeightInput(ship.weight ? ship.weight.toLocaleString('vi-VN', { maximumFractionDigits: 5 }) : '');

        // Port
        if (ship.port) {
            const isPresetPort = (STANDARD_PORTS as readonly string[]).includes(ship.port) && ship.port !== 'Cảng Khác';
            if (isPresetPort) {
                setPort(ship.port);
                setCustomPort('');
            } else {
                setPort('Cảng Khác');
                setCustomPort(ship.port === 'Cảng Khác' ? '' : ship.port);
            }
        } else {
            setPort('Sowatco Long Bình');
            setCustomPort('');
        }

        // Client
        if (ship.client) {
            const isPresetClient = (STANDARD_CLIENTS as readonly string[]).includes(ship.client) && ship.client !== 'Khác (Tự nhập)';
            if (isPresetClient) {
                setClient(ship.client);
                setCustomClient('');
            } else {
                setClient('Khác (Tự nhập)');
                setCustomClient(ship.client === 'Khác (Tự nhập)' ? '' : ship.client);
            }
        } else {
            setClient('Hoà Phát');
            setCustomClient('');
        }

        // Barge
        setHasBarge(!!ship.hasBarge);
        setBargeCount(ship.bargeCount && ship.bargeCount > 0 ? ship.bargeCount : 1);

        // Rating, Cafe, Tally
        setRating(ship.rating || 0);
        setRatingComment(ship.ratingComment || '');
        setHasCafeFee(!!ship.hasCafeFee);
        setCafeFee(ship.cafeFee || 0);
        setCafeNote(ship.cafeNote || '');
        setHasTally(!!ship.hasTally);
        setTallyFee(ship.tallyFee || 0);
        setTallyNote(ship.tallyNote || '');
    };

    const handleClearForm = () => {
        setSelectedShip(null);
        setShipNameInput('');
        setSearchQuery('');
        setStatus('waiting');
        setArrivalDate(new Date().toISOString().split('T')[0]);
        setCompletionDate('');
        setWeightInput('');
        setPort('Sowatco Long Bình');
        setCustomPort('');
        setClient('Hoà Phát');
        setCustomClient('');
        setHasBarge(false);
        setBargeCount(1);
        setRating(0);
        setRatingComment('');
        setHasCafeFee(false);
        setCafeFee(0);
        setCafeNote('');
        setHasTally(false);
        setTallyFee(0);
        setTallyNote('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalName = (mode === 'update' && selectedShip ? selectedShip.name : shipNameInput).trim();
        if (!finalName) {
            alert('Vui lòng nhập tên chuyến tàu!');
            return;
        }

        const parsedWeight = parseFloat(weightInput.replace(/\./g, '').replace(/,/g, '.')) || 0;
        const finalPort = port === 'Cảng Khác' ? (customPort.trim() || 'Cảng Khác') : port;
        const finalClient = client === 'Khác (Tự nhập)' ? (customClient.trim() || 'Khác') : client;

        setIsSaving(true);
        try {
            if (mode === 'update' && selectedShip) {
                // Update existing ship
                const updated: Ship = {
                    ...selectedShip,
                    name: finalName,
                    status: status,
                    arrivalDate: new Date(arrivalDate).toISOString(),
                    completionDate: completionDate ? new Date(completionDate).toISOString() : undefined,
                    weight: parsedWeight,
                    port: finalPort,
                    client: finalClient,
                    hasBarge: !!hasBarge,
                    bargeCount: hasBarge ? Math.max(1, bargeCount) : 0,
                    rating: rating > 0 ? rating : undefined,
                    ratingComment: ratingComment.trim() || undefined,
                    hasCafeFee: !!hasCafeFee,
                    cafeFee: hasCafeFee ? (Number(cafeFee) || 0) : 0,
                    cafeNote: hasCafeFee ? cafeNote.trim() : undefined,
                    hasTally: !!hasTally,
                    tallyFee: hasTally ? (Number(tallyFee) || 0) : 0,
                    tallyNote: hasTally ? tallyNote.trim() : undefined,
                };
                await updateShip(updated);
                setSaveSuccessMsg(`Đã cập nhật thông tin tàu "${finalName}" thành công!`);
            } else {
                // Create new ship or update if exact name exists
                const existing = ships.find(s => s.name.toLowerCase().trim() === finalName.toLowerCase());
                if (existing) {
                    const updated: Ship = {
                        ...existing,
                        status: status,
                        arrivalDate: new Date(arrivalDate).toISOString(),
                        completionDate: completionDate ? new Date(completionDate).toISOString() : undefined,
                        weight: parsedWeight,
                        port: finalPort,
                        client: finalClient,
                        hasBarge: !!hasBarge,
                        bargeCount: hasBarge ? Math.max(1, bargeCount) : 0,
                        rating: rating > 0 ? rating : undefined,
                        ratingComment: ratingComment.trim() || undefined,
                        hasCafeFee: !!hasCafeFee,
                        cafeFee: hasCafeFee ? (Number(cafeFee) || 0) : 0,
                        cafeNote: hasCafeFee ? cafeNote.trim() : undefined,
                        hasTally: !!hasTally,
                        tallyFee: hasTally ? (Number(tallyFee) || 0) : 0,
                        tallyNote: hasTally ? tallyNote.trim() : undefined,
                    };
                    await updateShip(updated);
                    setSaveSuccessMsg(`Đã cập nhật dữ liệu tàu "${finalName}" thành công!`);
                } else {
                    const newShip: Ship = {
                        id: `shp-${Date.now()}`,
                        name: finalName,
                        arrivalDate: new Date(arrivalDate).toISOString(),
                        completionDate: completionDate ? new Date(completionDate).toISOString() : undefined,
                        weight: parsedWeight,
                        division: 'SAT_THEP',
                        status: status,
                        port: finalPort,
                        client: finalClient,
                        hasBarge: !!hasBarge,
                        bargeCount: hasBarge ? Math.max(1, bargeCount) : 0,
                        documents: [],
                        rating: rating > 0 ? rating : undefined,
                        ratingComment: ratingComment.trim() || undefined,
                        hasCafeFee: !!hasCafeFee,
                        cafeFee: hasCafeFee ? (Number(cafeFee) || 0) : 0,
                        cafeNote: hasCafeFee ? cafeNote.trim() : undefined,
                        hasTally: !!hasTally,
                        tallyFee: hasTally ? (Number(tallyFee) || 0) : 0,
                        tallyNote: hasTally ? tallyNote.trim() : undefined,
                    };
                    await addShip(newShip);
                    setSaveSuccessMsg(`Đã nhập chuyến tàu mới "${finalName}" thành công!`);
                    handleClearForm();
                }
            }
            setTimeout(() => setSaveSuccessMsg(''), 4500);
        } catch (err: any) {
            console.error('Lỗi khi lưu thông tin tàu:', err);
            alert('Lỗi: ' + (err.message || 'Không thể lưu dữ liệu'));
        } finally {
            setIsSaving(false);
        }
    };

    // Recently updated/created ships
    const recentShips = useMemo(() => {
        return [...ships]
            .sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime())
            .slice(0, 6);
    }, [ships]);

    return (
        <div style={{
            minHeight: '100dvh',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: '16px 16px 60px 16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
                {/* ── Top Header ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 12px', borderRadius: 12,
                            background: '#ffffff', border: '1px solid #e2e8f0',
                            color: '#334155', fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                        }}
                    >
                        <ArrowLeft size={16} /> Màn hình chính
                    </button>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '4px 8px', borderRadius: 8 }}>
                        Sắt Thép
                    </span>
                </div>

                {/* ── Title Banner ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: 20, padding: '18px 20px', color: '#fff',
                    marginBottom: 16, boxShadow: '0 10px 25px -5px rgba(15,23,42,0.25)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', right: -15, bottom: -15, opacity: 0.08, pointerEvents: 'none' }}>
                        <ShipIcon size={120} color="#fff" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ClipboardCheck size={20} color="#38bdf8" />
                        </div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
                            Cập Nhật Tàu & Nhập Tàu
                        </h1>
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                        Nhập thông tin chuyến tàu, đánh giá chất lượng, tiền cafe và chi phí tally
                    </p>
                </div>

                {/* ── Mode Segmented Control ── */}
                <div style={{
                    display: 'flex', background: '#e2e8f0', borderRadius: 14,
                    padding: 4, marginBottom: 18
                }}>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('create');
                            setSelectedShip(null);
                        }}
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            background: mode === 'create' ? '#ffffff' : 'transparent',
                            color: mode === 'create' ? '#059669' : '#64748b',
                            boxShadow: mode === 'create' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <PlusCircle size={16} /> Nhập tàu mới
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('update')}
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            background: mode === 'update' ? '#ffffff' : 'transparent',
                            color: mode === 'update' ? '#059669' : '#64748b',
                            boxShadow: mode === 'update' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Search size={16} /> Tìm & Cập nhật
                    </button>
                </div>

                {/* ── Success Toast ── */}
                {saveSuccessMsg && (
                    <div style={{
                        background: '#ecfdf5', border: '1.5px solid #10b981',
                        borderRadius: 14, padding: '12px 14px', marginBottom: 16,
                        display: 'flex', alignItems: 'center', gap: 10,
                        color: '#065f46', fontSize: 13, fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(16,185,129,0.15)'
                    }}>
                        <CheckCircle2 size={18} color="#10b981" />
                        <span>{saveSuccessMsg}</span>
                    </div>
                )}

                {/* ── Form Section ── */}
                <form onSubmit={handleSave}>
                    {/* Card 1: Thông tin tàu */}
                    <div style={{
                        background: '#ffffff', borderRadius: 18, padding: 18,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0',
                        marginBottom: 16, position: 'relative'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShipIcon size={16} color="#0284c7" />
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                                    {mode === 'create' ? 'Thông tin chuyến tàu mới' : 'Tìm & Chọn chuyến tàu'}
                                </span>
                            </div>
                            {mode === 'update' && selectedShip && (
                                <button
                                    type="button"
                                    onClick={handleClearForm}
                                    style={{
                                        border: 'none', background: '#fee2e2', color: '#b91c1c',
                                        fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                    }}
                                >
                                    <RotateCcw size={11} /> Chọn tàu khác
                                </button>
                            )}
                        </div>

                        {/* Search in 'update' mode */}
                        {mode === 'update' && (
                            <div style={{ position: 'relative', marginBottom: 12 }}>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => {
                                        setSearchQuery(e.target.value);
                                        setShipNameInput(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    placeholder="Gõ tên tàu để tìm kiếm..."
                                    required
                                    style={{
                                        width: '100%', padding: '12px 14px 12px 38px',
                                        borderRadius: 12, border: selectedShip ? '1.5px solid #059669' : '1px solid #cbd5e1',
                                        background: selectedShip ? '#f0fdf4' : '#ffffff',
                                        fontSize: 14, fontWeight: selectedShip ? 700 : 500,
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                                <div style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }}>
                                    <Search size={18} />
                                </div>

                                {/* Autocomplete Dropdown */}
                                {isDropdownOpen && suggestedShips.length > 0 && (
                                    <div style={{
                                        position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 30,
                                        background: '#ffffff', borderRadius: 14, marginTop: 6,
                                        border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                                        maxHeight: 240, overflowY: 'auto'
                                    }}>
                                        <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
                                            GỢI Ý TÀU CÓ SẴN ({suggestedShips.length})
                                        </div>
                                        {suggestedShips.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => handleSelectShip(s)}
                                                style={{
                                                    padding: '10px 14px', cursor: 'pointer',
                                                    borderBottom: '1px solid #f8fafc',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                                            >
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                                        {new Date(s.arrivalDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} • {s.port || 'Sowatco'} {s.client ? `• ${s.client}` : ''}
                                                    </div>
                                                </div>
                                                {s.rating && (
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>
                                                        ⭐ {s.rating}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ship Name input in 'create' mode */}
                        {mode === 'create' && (
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Tên tàu <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={shipNameInput}
                                    onChange={e => setShipNameInput(e.target.value)}
                                    placeholder="VD: Hải An 01, Ever Given..."
                                    required
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 10,
                                        border: '1px solid #cbd5e1', fontSize: 14, outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}

                        {/* Trạng thái + Sản lượng */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Trạng thái
                                </label>
                                <select
                                    value={status}
                                    onChange={e => {
                                        const val = e.target.value as ShipStatus;
                                        setStatus(val);
                                        if (val === 'completed' && !completionDate) {
                                            setCompletionDate(new Date().toISOString().split('T')[0]);
                                        }
                                    }}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 10,
                                        border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="waiting">Đang neo (Chờ slot)</option>
                                    <option value="entering">Đã cập bến</option>
                                    <option value="working">Đang làm hàng</option>
                                    <option value="completed">Đã hoàn thành</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Sản lượng (tấn)
                                </label>
                                <input
                                    type="text"
                                    value={weightInput}
                                    onChange={e => setWeightInput(formatVNWeight(e.target.value))}
                                    placeholder="VD: 5.000"
                                    inputMode="decimal"
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 10,
                                        border: '1px solid #cbd5e1', fontSize: 13, outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Ngày vào + Ngày xong */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Ngày vào cảng
                                </label>
                                <input
                                    type="date"
                                    value={arrivalDate}
                                    onChange={e => setArrivalDate(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', padding: '9px 10px', borderRadius: 10,
                                        border: '1px solid #cbd5e1', fontSize: 12, outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Ngày hoàn thành
                                </label>
                                <input
                                    type="date"
                                    value={completionDate}
                                    onChange={e => setCompletionDate(e.target.value)}
                                    style={{
                                        width: '100%', padding: '9px 10px', borderRadius: 10,
                                        border: '1px solid #cbd5e1', fontSize: 12, outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Cảng dỡ + Khách hàng */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Cảng dỡ
                                </label>
                                <select
                                    value={port}
                                    onChange={e => {
                                        setPort(e.target.value);
                                        if (e.target.value !== 'Cảng Khác') setCustomPort('');
                                    }}
                                    style={{
                                        width: '100%', padding: '10px 10px', borderRadius: 10,
                                        border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                >
                                    {STANDARD_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                {port === 'Cảng Khác' && (
                                    <input
                                        type="text"
                                        value={customPort}
                                        onChange={e => setCustomPort(e.target.value)}
                                        placeholder="Nhập tên cảng khác..."
                                        style={{
                                            width: '100%', marginTop: 6, padding: '8px 10px', borderRadius: 8,
                                            border: '1px solid #0284c7', background: '#f8fafc',
                                            fontSize: 12, outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                )}
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Khách hàng (Hàng)
                                </label>
                                <select
                                    value={client}
                                    onChange={e => {
                                        setClient(e.target.value);
                                        if (e.target.value !== 'Khác (Tự nhập)') setCustomClient('');
                                    }}
                                    style={{
                                        width: '100%', padding: '10px 10px', borderRadius: 10,
                                        border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                >
                                    {STANDARD_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {client === 'Khác (Tự nhập)' && (
                                    <input
                                        type="text"
                                        value={customClient}
                                        onChange={e => setCustomClient(e.target.value)}
                                        placeholder="Nhập tên khách hàng..."
                                        style={{
                                            width: '100%', marginTop: 6, padding: '8px 10px', borderRadius: 8,
                                            border: '1px solid #0284c7', background: '#f8fafc',
                                            fontSize: 12, outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Xà lan (Salan) Switch */}
                        <div style={{
                            background: hasBarge ? '#eff6ff' : '#f8fafc',
                            border: hasBarge ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                            borderRadius: 12, padding: '10px 12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                    Kèm xà lan (Salan)
                                    <span style={{ display: 'block', fontSize: 11, color: hasBarge ? '#2563eb' : '#64748b', fontWeight: 500 }}>
                                        {hasBarge ? `+${(bargeCount * 200000).toLocaleString('vi-VN')}đ (+200k/salan)` : 'Không có xà lan'}
                                    </span>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={hasBarge}
                                        onChange={e => {
                                            setHasBarge(e.target.checked);
                                            if (e.target.checked && (!bargeCount || bargeCount < 1)) setBargeCount(1);
                                        }}
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: hasBarge ? '#2563eb' : '#cbd5e1',
                                        transition: '.3s', borderRadius: 34, pointerEvents: 'none'
                                    }}>
                                        <span style={{
                                            position: 'absolute', height: 16, width: 16, left: 3, bottom: 3,
                                            backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                                            transform: hasBarge ? 'translateX(18px)' : 'translateX(0)'
                                        }} />
                                    </span>
                                </label>
                            </div>
                            {hasBarge && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>Số lượng xà lan:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <button
                                            type="button"
                                            onClick={() => setBargeCount(Math.max(1, bargeCount - 1))}
                                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                                        >-</button>
                                        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{bargeCount}</span>
                                        <button
                                            type="button"
                                            onClick={() => setBargeCount(bargeCount + 1)}
                                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                                        >+</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Đánh giá tàu */}
                    <div style={{
                        background: '#ffffff', borderRadius: 18, padding: 18,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0',
                        marginBottom: 16
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Star size={16} color="#d97706" />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Đánh giá tàu</span>
                        </div>

                        {/* Interactive Stars */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '6px 0' }}>
                            {[1, 2, 3, 4, 5].map(starNum => {
                                const active = rating >= starNum;
                                return (
                                    <button
                                        key={starNum}
                                        type="button"
                                        onClick={() => setRating(rating === starNum ? 0 : starNum)}
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                                    >
                                        <Star
                                            size={36}
                                            fill={active ? '#f59e0b' : '#e2e8f0'}
                                            color={active ? '#d97706' : '#cbd5e1'}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        {rating > 0 && STAR_LABELS[rating] && (
                            <div style={{
                                textAlign: 'center', margin: '4px 0 10px 0',
                                padding: '6px 10px', borderRadius: 8,
                                background: STAR_LABELS[rating].bg,
                                color: STAR_LABELS[rating].color,
                                fontSize: 13, fontWeight: 700
                            }}>
                                {rating} sao: {STAR_LABELS[rating].text}
                            </div>
                        )}

                        <textarea
                            value={ratingComment}
                            onChange={e => setRatingComment(e.target.value)}
                            placeholder="Ghi chú đánh giá (VD: cẩu bốc dỡ nhanh, hàng cuộn đẹp, thuận lợi...)"
                            rows={2}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: 10,
                                border: '1px solid #cbd5e1', fontSize: 13, outline: 'none',
                                fontFamily: 'inherit', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Card 3: Tiền Cafe Tàu */}
                    <div style={{
                        background: hasCafeFee ? '#fffbeb' : '#ffffff',
                        border: hasCafeFee ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                        borderRadius: 18, padding: 18,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                        marginBottom: 16, transition: 'all 0.2s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 34, height: 34, borderRadius: 10,
                                    background: hasCafeFee ? '#fef3c7' : '#f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: hasCafeFee ? '#b45309' : '#64748b'
                                }}>
                                    <Coffee size={18} />
                                </div>
                                <div>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'block' }}>
                                        Tiền Cafe Tàu
                                    </span>
                                    <span style={{ fontSize: 11, color: hasCafeFee ? '#b45309' : '#64748b' }}>
                                        {hasCafeFee ? `${formatVNCurrency(cafeFee)}đ` : 'Không phát sinh tiền cafe'}
                                    </span>
                                </div>
                            </div>

                            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={hasCafeFee}
                                    onChange={e => {
                                        setHasCafeFee(e.target.checked);
                                        if (e.target.checked && (!cafeFee || cafeFee === 0)) setCafeFee(100000);
                                    }}
                                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: hasCafeFee ? '#f59e0b' : '#cbd5e1',
                                    transition: '.3s', borderRadius: 34, pointerEvents: 'none'
                                }}>
                                    <span style={{
                                        position: 'absolute', height: 18, width: 18, left: 3, bottom: 3,
                                        backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                                        transform: hasCafeFee ? 'translateX(20px)' : 'translateX(0)'
                                    }} />
                                </span>
                            </label>
                        </div>

                        {hasCafeFee && (
                            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #fcd34d' }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#92400e', display: 'block', marginBottom: 6 }}>
                                    Số tiền cafe (VNĐ):
                                </label>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                    {QUICK_CAFE_AMOUNTS.map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setCafeFee(amt)}
                                            style={{
                                                padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                background: cafeFee === amt ? '#d97706' : '#ffffff',
                                                color: cafeFee === amt ? '#ffffff' : '#78350f',
                                                border: '1px solid #fde68a', cursor: 'pointer'
                                            }}
                                        >
                                            {formatVNCurrency(amt)}đ
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={cafeFee ? formatVNCurrency(cafeFee) : ''}
                                    onChange={e => {
                                        const clean = e.target.value.replace(/\D/g, '');
                                        setCafeFee(clean ? parseInt(clean, 10) : 0);
                                    }}
                                    placeholder="Nhập số tiền..."
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 10,
                                        border: '1px solid #d97706', background: '#ffffff',
                                        fontSize: 14, fontWeight: 700, outline: 'none',
                                        marginBottom: 8, boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={cafeNote}
                                    onChange={e => setCafeNote(e.target.value)}
                                    placeholder="Ghi chú tiền cafe (ai chi / ai nhận)..."
                                    style={{
                                        width: '100%', padding: '8px 10px', borderRadius: 8,
                                        border: '1px solid #fde68a', background: '#ffffff',
                                        fontSize: 12, outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Card 4: Tally Tàu */}
                    <div style={{
                        background: hasTally ? '#eff6ff' : '#ffffff',
                        border: hasTally ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                        borderRadius: 18, padding: 18,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                        marginBottom: 20, transition: 'all 0.2s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 34, height: 34, borderRadius: 10,
                                    background: hasTally ? '#dbeafe' : '#f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: hasTally ? '#1d4ed8' : '#64748b'
                                }}>
                                    <ClipboardCheck size={18} />
                                </div>
                                <div>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'block' }}>
                                        Tally Tàu
                                    </span>
                                    <span style={{ fontSize: 11, color: hasTally ? '#1d4ed8' : '#64748b' }}>
                                        {hasTally ? `Chi phí tally: ${formatVNCurrency(tallyFee)}đ` : 'Không có tally tàu'}
                                    </span>
                                </div>
                            </div>

                            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={hasTally}
                                    onChange={e => {
                                        setHasTally(e.target.checked);
                                        if (e.target.checked && (!tallyFee || tallyFee === 0)) setTallyFee(200000);
                                    }}
                                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: hasTally ? '#2563eb' : '#cbd5e1',
                                    transition: '.3s', borderRadius: 34, pointerEvents: 'none'
                                }}>
                                    <span style={{
                                        position: 'absolute', height: 18, width: 18, left: 3, bottom: 3,
                                        backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                                        transform: hasTally ? 'translateX(20px)' : 'translateX(0)'
                                    }} />
                                </span>
                            </label>
                        </div>

                        {hasTally && (
                            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #bfdbfe' }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', display: 'block', marginBottom: 6 }}>
                                    Chi phí tally (VNĐ):
                                </label>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                    {QUICK_TALLY_AMOUNTS.map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setTallyFee(amt)}
                                            style={{
                                                padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                background: tallyFee === amt ? '#2563eb' : '#ffffff',
                                                color: tallyFee === amt ? '#ffffff' : '#1e3a8a',
                                                border: '1px solid #bfdbfe', cursor: 'pointer'
                                            }}
                                        >
                                            {formatVNCurrency(amt)}đ
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={tallyFee ? formatVNCurrency(tallyFee) : ''}
                                    onChange={e => {
                                        const clean = e.target.value.replace(/\D/g, '');
                                        setTallyFee(clean ? parseInt(clean, 10) : 0);
                                    }}
                                    placeholder="Nhập chi phí tally..."
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 10,
                                        border: '1px solid #2563eb', background: '#ffffff',
                                        fontSize: 14, fontWeight: 700, outline: 'none',
                                        marginBottom: 8, boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={tallyNote}
                                    onChange={e => setTallyNote(e.target.value)}
                                    placeholder="Người/đơn vị phụ trách tally hoặc ghi chú..."
                                    style={{
                                        width: '100%', padding: '8px 10px', borderRadius: 8,
                                        border: '1px solid #bfdbfe', background: '#ffffff',
                                        fontSize: 12, outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* ── Submit Button ── */}
                    <button
                        type="submit"
                        disabled={isSaving}
                        style={{
                            width: '100%', padding: '16px 20px', borderRadius: 16,
                            background: isSaving
                                ? '#94a3b8'
                                : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            color: '#ffffff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                            fontSize: 16, fontWeight: 800, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: 10,
                            boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Save size={20} />
                        {isSaving ? 'Đang lưu dữ liệu...' : (mode === 'create' ? 'Lưu Chuyến Tàu Mới' : 'Lưu Cập Nhật Tàu')}
                    </button>
                </form>

                {/* ── Recent Ships Section ── */}
                {recentShips.length > 0 && (
                    <div style={{ marginTop: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <Clock size={16} color="#64748b" />
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Các tàu gần đây
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {recentShips.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => {
                                        setMode('update');
                                        handleSelectShip(s);
                                    }}
                                    style={{
                                        background: '#ffffff', borderRadius: 14, padding: '12px 14px',
                                        border: '1px solid #e2e8f0', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                            {new Date(s.arrivalDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} • {s.port || 'Sowatco'} • {s.weight ? `${s.weight.toLocaleString('vi-VN')}t` : '0t'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {s.rating && (
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '3px 6px', borderRadius: 6 }}>
                                                ⭐ {s.rating}
                                            </span>
                                        )}
                                        {s.hasCafeFee && (
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', background: '#fffbeb', padding: '3px 6px', borderRadius: 6, border: '1px solid #fde68a' }}>
                                                ☕
                                            </span>
                                        )}
                                        {s.hasTally && (
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', background: '#eff6ff', padding: '3px 6px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                                                📋
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
