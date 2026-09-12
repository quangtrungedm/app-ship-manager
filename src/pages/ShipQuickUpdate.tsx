import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShips } from '../lib/useShips';
import { Ship, ShipStatus } from '../types';
import { STANDARD_PORTS, STANDARD_CLIENTS } from '../lib/constants';
import {
    ArrowLeft, Search, Star, Coffee, ClipboardCheck,
    Save, CheckCircle2, Ship as ShipIcon,
    Plus, X, Edit3, RefreshCw,
    Calendar, MapPin, Building2, Weight
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

const STATUS_MAP: Record<ShipStatus, { label: string; color: string; bg: string }> = {
    waiting: { label: 'Đang neo', color: '#b45309', bg: '#fef3c7' },
    entering: { label: 'Đã cập bến', color: '#1d4ed8', bg: '#dbeafe' },
    working: { label: 'Đang làm hàng', color: '#7c3aed', bg: '#ede9fe' },
    completed: { label: 'Hoàn thành', color: '#15803d', bg: '#dcfce7' },
};

const QUICK_CAFE_AMOUNTS = [50000, 100000, 200000, 500000];
const QUICK_TALLY_AMOUNTS = [100000, 200000, 300000, 500000];

export function ShipQuickUpdate() {
    const navigate = useNavigate();
    const { ships, loading, refresh, updateShip, addShip } = useShips();

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'has_info' | 'has_cafe' | 'no_cafe' | 'has_tally' | 'no_tally' | 'has_rating'>('all');

    // Modal state for editing or adding ship
    const [showModal, setShowModal] = useState(false);
    const [editingShip, setEditingShip] = useState<Ship | null>(null);

    // Form fields in modal
    const [name, setName] = useState('');
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

    // Operational fields: Rating, Cafe, Tally
    const [rating, setRating] = useState<number>(0);
    const [ratingComment, setRatingComment] = useState('');
    const [hasCafeFee, setHasCafeFee] = useState(false);
    const [cafeFee, setCafeFee] = useState<number>(0);
    const [cafeNote, setCafeNote] = useState('');
    const [hasTally, setHasTally] = useState(false);
    const [tallyFee, setTallyFee] = useState<number>(0);
    const [tallyNote, setTallyNote] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    // Open Modal to Edit existing ship
    const handleOpenEdit = (s: Ship) => {
        setEditingShip(s);
        setName(s.name);
        setStatus(s.status || 'waiting');
        setArrivalDate(s.arrivalDate ? s.arrivalDate.split('T')[0] : new Date().toISOString().split('T')[0]);
        setCompletionDate(s.completionDate ? s.completionDate.split('T')[0] : '');
        setWeightInput(s.weight ? s.weight.toLocaleString('vi-VN', { maximumFractionDigits: 5 }) : '');

        // Port
        if (s.port) {
            const isPresetPort = (STANDARD_PORTS as readonly string[]).includes(s.port) && s.port !== 'Cảng Khác';
            if (isPresetPort) {
                setPort(s.port);
                setCustomPort('');
            } else {
                setPort('Cảng Khác');
                setCustomPort(s.port === 'Cảng Khác' ? '' : s.port);
            }
        } else {
            setPort('Sowatco Long Bình');
            setCustomPort('');
        }

        // Client
        if (s.client) {
            const isPresetClient = (STANDARD_CLIENTS as readonly string[]).includes(s.client) && s.client !== 'Khác (Tự nhập)';
            if (isPresetClient) {
                setClient(s.client);
                setCustomClient('');
            } else {
                setClient('Khác (Tự nhập)');
                setCustomClient(s.client === 'Khác (Tự nhập)' ? '' : s.client);
            }
        } else {
            setClient('Hoà Phát');
            setCustomClient('');
        }

        setHasBarge(!!s.hasBarge);
        setBargeCount(s.bargeCount && s.bargeCount > 0 ? s.bargeCount : 1);

        // Rating, Cafe, Tally
        setRating(s.rating || 0);
        setRatingComment(s.ratingComment || '');
        setHasCafeFee(!!s.hasCafeFee);
        setCafeFee(s.cafeFee || 0);
        setCafeNote(s.cafeNote || '');
        setHasTally(!!s.hasTally);
        setTallyFee(s.tallyFee || 0);
        setTallyNote(s.tallyNote || '');

        setShowModal(true);
    };

    // Open Modal for New Ship
    const handleOpenNew = () => {
        setEditingShip(null);
        setName('');
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
        setCafeFee(100000);
        setCafeNote('');
        setHasTally(false);
        setTallyFee(200000);
        setTallyNote('');
        setShowModal(true);
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            alert('Vui lòng nhập tên tàu!');
            return;
        }

        const parsedWeight = parseFloat(weightInput.replace(/\./g, '').replace(/,/g, '.')) || 0;
        const finalPort = port === 'Cảng Khác' ? (customPort.trim() || 'Cảng Khác') : port;
        const finalClient = client === 'Khác (Tự nhập)' ? (customClient.trim() || 'Khác') : client;

        setIsSaving(true);
        try {
            if (editingShip) {
                const updated: Ship = {
                    ...editingShip,
                    name: trimmedName,
                    status,
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
                setToastMsg(`Đã cập nhật thông tin tàu "${trimmedName}" thành công!`);
            } else {
                const newShip: Ship = {
                    id: `shp-${Date.now()}`,
                    name: trimmedName,
                    arrivalDate: new Date(arrivalDate).toISOString(),
                    completionDate: completionDate ? new Date(completionDate).toISOString() : undefined,
                    weight: parsedWeight,
                    division: 'SAT_THEP',
                    status,
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
                setToastMsg(`Đã thêm mới chuyến tàu "${trimmedName}" thành công!`);
            }
            setShowModal(false);
            setTimeout(() => setToastMsg(''), 4500);
        } catch (err: any) {
            console.error('Lỗi lưu tàu:', err);
            alert('Lỗi lưu: ' + (err.message || 'Không thể lưu dữ liệu'));
        } finally {
            setIsSaving(false);
        }
    };

    // Filtered ships list
    const filteredShips = useMemo(() => {
        let list = [...ships];

        // Search
        if (searchQuery.trim()) {
            const q = removeAccents(searchQuery.toLowerCase().trim());
            list = list.filter(s =>
                removeAccents(s.name.toLowerCase()).includes(q)
                || (s.port && removeAccents(s.port.toLowerCase()).includes(q))
                || (s.client && removeAccents(s.client.toLowerCase()).includes(q))
                || (s.ratingComment && removeAccents(s.ratingComment.toLowerCase()).includes(q))
                || (s.cafeNote && removeAccents(s.cafeNote.toLowerCase()).includes(q))
                || (s.tallyNote && removeAccents(s.tallyNote.toLowerCase()).includes(q))
            );
        }

        // Tab filter
        if (filterTab === 'has_info') {
            list = list.filter(s => (s.rating && s.rating > 0) || s.hasCafeFee || s.hasTally || s.ratingComment);
        } else if (filterTab === 'has_cafe') {
            list = list.filter(s => s.hasCafeFee);
        } else if (filterTab === 'no_cafe') {
            list = list.filter(s => !s.hasCafeFee);
        } else if (filterTab === 'has_tally') {
            list = list.filter(s => s.hasTally);
        } else if (filterTab === 'no_tally') {
            list = list.filter(s => !s.hasTally);
        } else if (filterTab === 'has_rating') {
            list = list.filter(s => s.rating && s.rating > 0);
        }

        // Sort: newest arrival date first
        return list.sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());
    }, [ships, searchQuery, filterTab]);

    // Counts
    const counts = useMemo(() => ({
        all: ships.length,
        has_info: ships.filter(s => (s.rating && s.rating > 0) || s.hasCafeFee || s.hasTally || s.ratingComment).length,
        has_cafe: ships.filter(s => s.hasCafeFee).length,
        no_cafe: ships.filter(s => !s.hasCafeFee).length,
        has_tally: ships.filter(s => s.hasTally).length,
        no_tally: ships.filter(s => !s.hasTally).length,
        has_rating: ships.filter(s => s.rating && s.rating > 0).length,
    }), [ships]);

    return (
        <div style={{
            minHeight: '100dvh',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: '16px 16px 80px 16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ maxWidth: 540, margin: '0 auto' }}>
                {/* ── Top Bar ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
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
                    <button
                        onClick={handleOpenNew}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 15px', borderRadius: 12,
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            border: 'none', color: '#ffffff', fontSize: 13, fontWeight: 800,
                            cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                        }}
                    >
                        <Plus size={16} strokeWidth={2.5} /> Nhập tàu mới
                    </button>
                </div>

                {/* ── Header Banner ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: 20, padding: '18px 20px', color: '#fff',
                    marginBottom: 16, boxShadow: '0 10px 25px -5px rgba(15,23,42,0.25)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', right: -10, bottom: -15, opacity: 0.08, pointerEvents: 'none' }}>
                        <ShipIcon size={120} color="#fff" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ClipboardCheck size={20} color="#38bdf8" />
                            </div>
                            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
                                Cập Nhật Tàu
                            </h1>
                        </div>
                        <button
                            onClick={() => refresh()}
                            title="Làm mới"
                            style={{
                                background: 'rgba(255,255,255,0.12)', border: 'none',
                                borderRadius: 8, padding: 6, color: '#fff', cursor: 'pointer'
                            }}
                        >
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                        Danh sách các tàu đã nhập • Kiểm tra tiền cafe, tally tàu và nhận xét đánh giá
                    </p>
                </div>

                {/* ── Toast Success ── */}
                {toastMsg && (
                    <div style={{
                        background: '#ecfdf5', border: '1.5px solid #10b981',
                        borderRadius: 14, padding: '12px 14px', marginBottom: 14,
                        display: 'flex', alignItems: 'center', gap: 10,
                        color: '#065f46', fontSize: 13, fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(16,185,129,0.15)'
                    }}>
                        <CheckCircle2 size={18} color="#10b981" />
                        <span>{toastMsg}</span>
                    </div>
                )}

                {/* ── Search Input ── */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm theo tên tàu, cảng, khách hàng..."
                        style={{
                            width: '100%', padding: '12px 14px 12px 40px',
                            borderRadius: 14, border: '1px solid #cbd5e1',
                            background: '#ffffff', fontSize: 14, outline: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)', boxSizing: 'border-box'
                        }}
                    />
                    <div style={{ position: 'absolute', left: 14, top: 13, color: '#94a3b8' }}>
                        <Search size={18} />
                    </div>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute', right: 12, top: 11,
                                border: 'none', background: '#f1f5f9', borderRadius: '50%',
                                width: 22, height: 22, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', color: '#64748b'
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* ── Filter Tabs ── */}
                <div style={{
                    display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6,
                    marginBottom: 16, scrollbarWidth: 'none'
                }}>
                    <button
                        onClick={() => setFilterTab('all')}
                        style={{
                            padding: '7px 12px', borderRadius: 10, border: 'none',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'all' ? '#0f172a' : '#ffffff',
                            color: filterTab === 'all' ? '#ffffff' : '#64748b',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                    >
                        Tất cả ({counts.all})
                    </button>
                    <button
                        onClick={() => setFilterTab('has_cafe')}
                        style={{
                            padding: '7px 12px', borderRadius: 10,
                            border: filterTab === 'has_cafe' ? 'none' : '1px solid #fde68a',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'has_cafe' ? '#d97706' : '#fffbeb',
                            color: filterTab === 'has_cafe' ? '#ffffff' : '#b45309',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        ☕ Có cafe ({counts.has_cafe})
                    </button>
                    <button
                        onClick={() => setFilterTab('no_cafe')}
                        style={{
                            padding: '7px 12px', borderRadius: 10,
                            border: filterTab === 'no_cafe' ? 'none' : '1px solid #fca5a5',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'no_cafe' ? '#dc2626' : '#fef2f2',
                            color: filterTab === 'no_cafe' ? '#ffffff' : '#b91c1c',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        ☕ Chưa có cafe ({counts.no_cafe})
                    </button>
                    <button
                        onClick={() => setFilterTab('has_tally')}
                        style={{
                            padding: '7px 12px', borderRadius: 10,
                            border: filterTab === 'has_tally' ? 'none' : '1px solid #bfdbfe',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'has_tally' ? '#2563eb' : '#eff6ff',
                            color: filterTab === 'has_tally' ? '#ffffff' : '#1d4ed8',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        📋 Có tally ({counts.has_tally})
                    </button>
                    <button
                        onClick={() => setFilterTab('no_tally')}
                        style={{
                            padding: '7px 12px', borderRadius: 10,
                            border: filterTab === 'no_tally' ? 'none' : '1px solid #fca5a5',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'no_tally' ? '#dc2626' : '#fef2f2',
                            color: filterTab === 'no_tally' ? '#ffffff' : '#b91c1c',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        📋 Chưa có tally ({counts.no_tally})
                    </button>
                    <button
                        onClick={() => setFilterTab('has_rating')}
                        style={{
                            padding: '7px 12px', borderRadius: 10,
                            border: filterTab === 'has_rating' ? 'none' : '1px solid #fef08a',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'has_rating' ? '#ca8a04' : '#ffffff',
                            color: filterTab === 'has_rating' ? '#ffffff' : '#854d0e',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        ⭐ Có đánh giá ({counts.has_rating})
                    </button>
                </div>

                {/* ── FULL LIST OF SHIPS WITH EXPLICIT FIELDS ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filteredShips.length === 0 ? (
                        <div style={{
                            background: '#ffffff', borderRadius: 18, padding: 32,
                            textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0'
                        }}>
                            <ShipIcon size={36} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                            <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', color: '#1e293b' }}>
                                Không tìm thấy chuyến tàu nào
                            </p>
                            <p style={{ fontSize: 13, margin: 0 }}>
                                Bấm nút "+ Nhập tàu mới" bên trên để thêm tàu đầu tiên.
                            </p>
                        </div>
                    ) : (
                        filteredShips.map(s => {
                            const statusCfg = STATUS_MAP[s.status || 'waiting'];
                            const arrDate = new Date(s.arrivalDate).toLocaleDateString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric'
                            });
                            const hasBoth = s.hasCafeFee && s.hasTally;
                            const hasEither = s.hasCafeFee || s.hasTally;
                            const hasNeither = !s.hasCafeFee && !s.hasTally;
                            const accentColor = hasBoth ? '#10b981' : (hasEither ? '#f59e0b' : '#ef4444');

                            return (
                                <div
                                    key={s.id}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: 18,
                                        border: hasNeither ? '1.5px solid #fecaca' : (hasBoth ? '1.5px solid #a7f3d0' : '1.5px solid #fed7aa'),
                                        boxShadow: hasNeither ? '0 4px 14px rgba(239,68,68,0.06)' : '0 4px 14px rgba(0,0,0,0.03)',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Dải màu mép trái: Xanh = Đủ cả 2, Vàng = Có 1 trong 2, Đỏ = Chưa có cả 2 */}
                                    <div style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
                                        background: accentColor
                                    }} />

                                    {/* 1. Header: Tên tàu + Trạng thái & Nút Sửa + Box thông tin chi tiết */}
                                    <div style={{
                                        padding: '14px 16px 12px 18px',
                                        background: '#ffffff',
                                        borderBottom: '1px solid #f1f5f9'
                                    }}>
                                        {/* Dòng 1: Tên tàu (trái) + Trạng thái & Nút Sửa (phải) */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0, flex: 1 }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 12,
                                                    background: hasBoth ? '#f0fdf4' : (hasNeither ? '#fef2f2' : '#fffbeb'),
                                                    border: hasBoth ? '1px solid #bbf7d0' : (hasNeither ? '1px solid #fecaca' : '1px solid #fde68a'),
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: hasBoth ? '#15803d' : (hasNeither ? '#dc2626' : '#d97706'),
                                                    flexShrink: 0
                                                }}>
                                                    <ShipIcon size={22} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <h3 style={{
                                                        fontSize: 17, fontWeight: 800, color: '#0f172a',
                                                        margin: 0, lineHeight: 1.3,
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        {s.name}
                                                    </h3>

                                                    {/* Nhãn tóm tắt nổi bật ngay dưới tên tàu */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
                                                        {s.hasCafeFee ? (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                                                background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b'
                                                            }}>
                                                                ☕ CÓ CAFE ({formatVNCurrency(s.cafeFee || 0)}đ)
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                                                background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5'
                                                            }}>
                                                                ☕ KHÔNG CÓ CAFE
                                                            </span>
                                                        )}

                                                        {s.hasTally ? (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                                                background: '#dbeafe', color: '#1e40af', border: '1px solid #3b82f6'
                                                            }}>
                                                                📋 CÓ TALLY ({formatVNCurrency(s.tallyFee || 0)}đ)
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                                                background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5'
                                                            }}>
                                                                📋 KHÔNG CÓ TALLY
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                    background: statusCfg.bg, color: statusCfg.color, whiteSpace: 'nowrap'
                                                }}>
                                                    {statusCfg.label}
                                                </span>
                                                <button
                                                    onClick={() => handleOpenEdit(s)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                        padding: '6px 10px', borderRadius: 8,
                                                        background: '#ecfdf5', border: '1px solid #a7f3d0',
                                                        color: '#047857', fontSize: 12, fontWeight: 700,
                                                        cursor: 'pointer', whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    <Edit3 size={13} /> Sửa
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dòng 2: Khung 4 thông số chi tiết dưới tên tàu - Rõ ràng, không bị ngắt dòng ngang/dọc */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '8px 10px',
                                            padding: '9px 12px',
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <Calendar size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                                <div style={{ minWidth: 0 }}>
                                                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.1 }}>Ngày vào</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{arrDate}</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <MapPin size={14} color="#0284c7" style={{ flexShrink: 0 }} />
                                                <div style={{ minWidth: 0 }}>
                                                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.1 }}>Cảng dỡ</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', lineHeight: 1.3 }}>
                                                        {s.port || 'Sowatco Long Bình'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <Building2 size={14} color="#059669" style={{ flexShrink: 0 }} />
                                                <div style={{ minWidth: 0 }}>
                                                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.1 }}>Khách hàng / Hàng</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#047857', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', lineHeight: 1.3 }}>
                                                        {s.client || '—'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <Weight size={14} color="#d97706" style={{ flexShrink: 0 }} />
                                                <div style={{ minWidth: 0 }}>
                                                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.1 }}>Sản lượng</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                                                        {s.weight ? `${s.weight.toLocaleString('vi-VN')} tấn` : '0 tấn'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Body Details: 3 MỤC RÕ RÀNG */}
                                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {/* ── MỤC 1: TIỀN CAFE TÀU (Nổi bật nếu CÓ, MÀU ĐỎ nếu KHÔNG) ── */}
                                        <div style={{
                                            background: s.hasCafeFee ? '#fffbeb' : '#fef2f2',
                                            border: s.hasCafeFee ? '1.5px solid #f59e0b' : '1.5px solid #f87171',
                                            borderRadius: 14, padding: '12px 14px',
                                            boxShadow: s.hasCafeFee ? '0 2px 8px rgba(245,158,11,0.1)' : '0 2px 8px rgba(239,68,68,0.06)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 800,
                                                    color: s.hasCafeFee ? '#92400e' : '#991b1b',
                                                    textTransform: 'uppercase', letterSpacing: '0.4px',
                                                    display: 'flex', alignItems: 'center', gap: 6
                                                }}>
                                                    <Coffee size={16} color={s.hasCafeFee ? '#d97706' : '#dc2626'} /> Tiền cafe tàu
                                                </span>
                                                <span style={{
                                                    fontSize: 13, fontWeight: 800,
                                                    color: s.hasCafeFee ? '#92400e' : '#b91c1c',
                                                    background: s.hasCafeFee ? '#fef3c7' : '#fee2e2',
                                                    border: s.hasCafeFee ? '1.5px solid #d97706' : '1.5px solid #ef4444',
                                                    padding: '3px 10px', borderRadius: 8
                                                }}>
                                                    {s.hasCafeFee ? `✅ CÓ: ${formatVNCurrency(s.cafeFee || 0)} đ` : '❌ KHÔNG CÓ CAFE'}
                                                </span>
                                            </div>
                                            {s.hasCafeFee && s.cafeNote && (
                                                <div style={{
                                                    fontSize: 12, fontWeight: 600, color: '#78350f',
                                                    background: 'rgba(245,158,11,0.12)', padding: '6px 10px',
                                                    borderRadius: 8, marginTop: 8
                                                }}>
                                                    📝 Ghi chú: {s.cafeNote}
                                                </div>
                                            )}
                                        </div>

                                        {/* ── MỤC 2: TALLY TÀU (Nổi bật nếu CÓ, MÀU ĐỎ nếu KHÔNG) ── */}
                                        <div style={{
                                            background: s.hasTally ? '#eff6ff' : '#fef2f2',
                                            border: s.hasTally ? '1.5px solid #3b82f6' : '1.5px solid #f87171',
                                            borderRadius: 14, padding: '12px 14px',
                                            boxShadow: s.hasTally ? '0 2px 8px rgba(59,130,246,0.1)' : '0 2px 8px rgba(239,68,68,0.06)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 800,
                                                    color: s.hasTally ? '#1e40af' : '#991b1b',
                                                    textTransform: 'uppercase', letterSpacing: '0.4px',
                                                    display: 'flex', alignItems: 'center', gap: 6
                                                }}>
                                                    <ClipboardCheck size={16} color={s.hasTally ? '#2563eb' : '#dc2626'} /> Tally tàu
                                                </span>
                                                <span style={{
                                                    fontSize: 13, fontWeight: 800,
                                                    color: s.hasTally ? '#1e40af' : '#b91c1c',
                                                    background: s.hasTally ? '#dbeafe' : '#fee2e2',
                                                    border: s.hasTally ? '1.5px solid #2563eb' : '1.5px solid #ef4444',
                                                    padding: '3px 10px', borderRadius: 8
                                                }}>
                                                    {s.hasTally ? `✅ CÓ TALLY: ${formatVNCurrency(s.tallyFee || 0)} đ` : '❌ KHÔNG CÓ TALLY'}
                                                </span>
                                            </div>
                                            {s.hasTally && s.tallyNote && (
                                                <div style={{
                                                    fontSize: 12, fontWeight: 600, color: '#1e3a8a',
                                                    background: 'rgba(59,130,246,0.1)', padding: '6px 10px',
                                                    borderRadius: 8, marginTop: 8
                                                }}>
                                                    👤 Phụ trách / ghi chú: {s.tallyNote}
                                                </div>
                                            )}
                                        </div>

                                        {/* ── MỤC 3: ĐÁNH GIÁ & NHẬN XÉT TÀU ── */}
                                        <div style={{
                                            background: s.rating ? '#fefce8' : '#f8fafc',
                                            border: s.rating ? '1.5px solid #facc15' : '1px dashed #cbd5e1',
                                            borderRadius: 14, padding: '12px 14px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: s.rating ? '#854d0e' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Star size={16} color={s.rating ? '#d97706' : '#94a3b8'} /> Đánh giá tàu
                                                </span>
                                                {s.rating ? (
                                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#b45309' }}>
                                                        ⭐ {s.rating}/5 sao {STAR_LABELS[s.rating] ? `(${STAR_LABELS[s.rating].text})` : ''}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Chưa có đánh giá</span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontSize: 12, color: s.ratingComment ? '#1e293b' : '#94a3b8',
                                                fontStyle: s.ratingComment ? 'normal' : 'italic',
                                                fontWeight: s.ratingComment ? 600 : 400,
                                                marginTop: 4, lineHeight: 1.4,
                                                background: s.ratingComment ? 'rgba(255,255,255,0.7)' : 'transparent',
                                                padding: s.ratingComment ? '6px 10px' : '0',
                                                borderRadius: 8
                                            }}>
                                                {s.ratingComment ? `💬 "${s.ratingComment}"` : 'Chưa có nội dung nhận xét chi tiết.'}
                                            </div>
                                        </div>

                                        {/* Xà lan nếu có */}
                                        {s.hasBarge && (
                                            <div style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700, padding: '6px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                                                🚢 Kèm {s.bargeCount || 1} xà lan (+{((s.bargeCount || 1) * 200000).toLocaleString('vi-VN')}đ)
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Footer Bar: Chạm để sửa */}
                                    <div
                                        onClick={() => handleOpenEdit(s)}
                                        style={{
                                            padding: '8px 16px', background: '#fafafa',
                                            borderTop: '1px solid #f1f5f9', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            fontSize: 12, color: '#059669', fontWeight: 700
                                        }}
                                    >
                                        <span>Chạm vào đây để cập nhật thông tin tàu</span>
                                        <span style={{ color: '#94a3b8' }}>Chỉnh sửa →</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── MODAL SHEET ĐỂ CẬP NHẬT HOẶC THÊM MỚI ── */}
                {showModal && (
                    <div
                        onClick={() => setShowModal(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 100,
                            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', maxWidth: 540, maxHeight: '92vh',
                                background: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                                padding: '20px 20px 30px 20px', overflowY: 'auto', boxSizing: 'border-box',
                                animation: 'fadeUp 0.25s ease'
                            }}
                        >
                            {/* Handle & Header */}
                            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#cbd5e1', margin: '0 auto 16px' }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShipIcon size={20} color="#059669" />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                            {editingShip ? `Cập Nhật: ${editingShip.name}` : 'Nhập Tàu Mới'}
                                        </h2>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>
                                            Điền đầy đủ đánh giá, tiền cafe, tally và thông số tàu
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X size={18} color="#64748b" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* TÊN TÀU */}
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                        Tên tàu <span style={{ color: '#dc2626' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Nhập tên tàu (VD: Hải An 01, Ever Given...)"
                                        required
                                        style={{
                                            width: '100%', padding: '10px 12px', borderRadius: 10,
                                            border: '1px solid #cbd5e1', fontSize: 14, outline: 'none',
                                            background: '#ffffff', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                {/* PHẦN 1: ĐÁNH GIÁ & NHẬN XÉT */}
                                <div style={{ background: '#fffbeb', borderRadius: 16, padding: 14, border: '1px solid #fde68a', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                        <Star size={16} color="#d97706" />
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>1. Đánh giá chất lượng & nhận xét</span>
                                    </div>

                                    {/* Stars */}
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '4px 0' }}>
                                        {[1, 2, 3, 4, 5].map(starNum => {
                                            const active = rating >= starNum;
                                            return (
                                                <button
                                                    key={starNum}
                                                    type="button"
                                                    onClick={() => setRating(rating === starNum ? 0 : starNum)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}
                                                >
                                                    <Star
                                                        size={32}
                                                        fill={active ? '#f59e0b' : '#e2e8f0'}
                                                        color={active ? '#d97706' : '#cbd5e1'}
                                                        strokeWidth={1.5}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {rating > 0 && STAR_LABELS[rating] && (
                                        <div style={{ textAlign: 'center', margin: '2px 0 8px 0', fontSize: 12, fontWeight: 700, color: STAR_LABELS[rating].color }}>
                                            {rating} sao: {STAR_LABELS[rating].text}
                                        </div>
                                    )}

                                    <textarea
                                        value={ratingComment}
                                        onChange={e => setRatingComment(e.target.value)}
                                        placeholder="Nhận xét tàu thế nào (VD: cẩu bốc dỡ nhanh, cuộn thép đẹp, hàng cẩn thận...)"
                                        rows={2}
                                        style={{
                                            width: '100%', padding: '8px 10px', borderRadius: 10,
                                            border: '1px solid #fcd34d', background: '#ffffff',
                                            fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                {/* PHẦN 2: TIỀN CAFE TÀU */}
                                <div style={{ background: hasCafeFee ? '#fff7ed' : '#f8fafc', borderRadius: 16, padding: 14, border: hasCafeFee ? '1px solid #fdba74' : '1px solid #e2e8f0', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Coffee size={18} color="#ea580c" />
                                            <div>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', display: 'block' }}>2. Tiền Cafe Tàu</span>
                                                <span style={{ fontSize: 11, color: hasCafeFee ? '#c2410c' : '#64748b' }}>
                                                    {hasCafeFee ? `Có cafe: ${formatVNCurrency(cafeFee)}đ` : 'Không có tiền cafe'}
                                                </span>
                                            </div>
                                        </div>
                                        <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 24, cursor: 'pointer' }}>
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
                                                backgroundColor: hasCafeFee ? '#ea580c' : '#cbd5e1',
                                                transition: '.3s', borderRadius: 34, pointerEvents: 'none'
                                            }}>
                                                <span style={{
                                                    position: 'absolute', height: 18, width: 18, left: 3, bottom: 3,
                                                    backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                                                    transform: hasCafeFee ? 'translateX(18px)' : 'translateX(0)'
                                                }} />
                                            </span>
                                        </label>
                                    </div>

                                    {hasCafeFee && (
                                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #fed7aa' }}>
                                            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                                {QUICK_CAFE_AMOUNTS.map(amt => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setCafeFee(amt)}
                                                        style={{
                                                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                                            background: cafeFee === amt ? '#ea580c' : '#ffffff',
                                                            color: cafeFee === amt ? '#ffffff' : '#9a3412',
                                                            border: '1px solid #fdba74', cursor: 'pointer'
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
                                                placeholder="Nhập số tiền cafe..."
                                                style={{
                                                    width: '100%', padding: '8px 10px', borderRadius: 8,
                                                    border: '1px solid #ea580c', background: '#ffffff',
                                                    fontSize: 13, fontWeight: 700, outline: 'none', marginBottom: 6, boxSizing: 'border-box'
                                                }}
                                            />
                                            <input
                                                type="text"
                                                value={cafeNote}
                                                onChange={e => setCafeNote(e.target.value)}
                                                placeholder="Ghi chú tiền cafe (ai chi / ai nhận)..."
                                                style={{
                                                    width: '100%', padding: '7px 10px', borderRadius: 8,
                                                    border: '1px solid #fed7aa', background: '#ffffff',
                                                    fontSize: 12, outline: 'none', boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* PHẦN 3: TALLY TÀU */}
                                <div style={{ background: hasTally ? '#eff6ff' : '#f8fafc', borderRadius: 16, padding: 14, border: hasTally ? '1px solid #93c5fd' : '1px solid #e2e8f0', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <ClipboardCheck size={18} color="#2563eb" />
                                            <div>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', display: 'block' }}>3. Tally Tàu</span>
                                                <span style={{ fontSize: 11, color: hasTally ? '#1d4ed8' : '#64748b' }}>
                                                    {hasTally ? `Có tally: ${formatVNCurrency(tallyFee)}đ` : 'Không có tally tàu'}
                                                </span>
                                            </div>
                                        </div>
                                        <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 24, cursor: 'pointer' }}>
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
                                                    transform: hasTally ? 'translateX(18px)' : 'translateX(0)'
                                                }} />
                                            </span>
                                        </label>
                                    </div>

                                    {hasTally && (
                                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #bfdbfe' }}>
                                            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                                {QUICK_TALLY_AMOUNTS.map(amt => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setTallyFee(amt)}
                                                        style={{
                                                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
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
                                                    width: '100%', padding: '8px 10px', borderRadius: 8,
                                                    border: '1px solid #2563eb', background: '#ffffff',
                                                    fontSize: 13, fontWeight: 700, outline: 'none', marginBottom: 6, boxSizing: 'border-box'
                                                }}
                                            />
                                            <input
                                                type="text"
                                                value={tallyNote}
                                                onChange={e => setTallyNote(e.target.value)}
                                                placeholder="Người phụ trách tally hoặc ghi chú..."
                                                style={{
                                                    width: '100%', padding: '7px 10px', borderRadius: 8,
                                                    border: '1px solid #bfdbfe', background: '#ffffff',
                                                    fontSize: 12, outline: 'none', boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* PHẦN 4: THÔNG SỐ CHUYẾN TÀU */}
                                <div style={{ background: '#f8fafc', borderRadius: 16, padding: 14, border: '1px solid #e2e8f0', marginBottom: 18 }}>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 10 }}>
                                        4. Thông số chuyến tàu
                                    </span>

                                    {/* Trạng thái + Sản lượng */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                                Trạng thái
                                            </label>
                                            <select
                                                value={status}
                                                onChange={e => setStatus(e.target.value as ShipStatus)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                                            >
                                                <option value="waiting">Đang neo</option>
                                                <option value="entering">Đã cập</option>
                                                <option value="working">Đang làm</option>
                                                <option value="completed">Hoàn thành</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                                Sản lượng (tấn)
                                            </label>
                                            <input
                                                type="text"
                                                value={weightInput}
                                                onChange={e => setWeightInput(formatVNWeight(e.target.value))}
                                                placeholder="0"
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Cảng + Khách hàng */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                                Cảng dỡ
                                            </label>
                                            <select
                                                value={port}
                                                onChange={e => {
                                                    setPort(e.target.value);
                                                    if (e.target.value !== 'Cảng Khác') setCustomPort('');
                                                }}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                                            >
                                                {STANDARD_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                            {port === 'Cảng Khác' && (
                                                <input
                                                    type="text"
                                                    value={customPort}
                                                    onChange={e => setCustomPort(e.target.value)}
                                                    placeholder="Tên cảng khác..."
                                                    style={{ width: '100%', marginTop: 4, padding: '6px 8px', borderRadius: 6, border: '1px solid #059669', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                                                Khách hàng
                                            </label>
                                            <select
                                                value={client}
                                                onChange={e => {
                                                    setClient(e.target.value);
                                                    if (e.target.value !== 'Khác (Tự nhập)') setCustomClient('');
                                                }}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                                            >
                                                {STANDARD_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            {client === 'Khác (Tự nhập)' && (
                                                <input
                                                    type="text"
                                                    value={customClient}
                                                    onChange={e => setCustomClient(e.target.value)}
                                                    placeholder="Tên khách..."
                                                    style={{ width: '100%', marginTop: 4, padding: '6px 8px', borderRadius: 6, border: '1px solid #059669', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Xà lan */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                            Kèm xà lan (Salan): {hasBarge ? `+${(bargeCount * 200000).toLocaleString('vi-VN')}đ` : 'Không'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {hasBarge && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <button type="button" onClick={() => setBargeCount(Math.max(1, bargeCount - 1))} style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>-</button>
                                                    <span style={{ fontSize: 12, fontWeight: 800 }}>{bargeCount}</span>
                                                    <button type="button" onClick={() => setBargeCount(bargeCount + 1)} style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>+</button>
                                                </div>
                                            )}
                                            <input
                                                type="checkbox"
                                                checked={hasBarge}
                                                onChange={e => {
                                                    setHasBarge(e.target.checked);
                                                    if (e.target.checked && (!bargeCount || bargeCount < 1)) setBargeCount(1);
                                                }}
                                                style={{ width: 16, height: 16 }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Nút lưu */}
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    style={{
                                        width: '100%', padding: '16px 20px', borderRadius: 14,
                                        background: isSaving ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                        color: '#ffffff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                                        fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(16,185,129,0.3)'
                                    }}
                                >
                                    <Save size={18} />
                                    {isSaving ? 'Đang lưu...' : (editingShip ? 'Lưu Cập Nhật Tàu' : 'Lưu Chuyến Tàu Mới')}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
