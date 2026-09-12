import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShips } from '../lib/useShips';
import { Ship, ShipStatus } from '../types';
import { STANDARD_PORTS, STANDARD_CLIENTS } from '../lib/constants';
import {
    ArrowLeft, Search, Star, Coffee, ClipboardList,
    Save, CheckCircle2, Ship as ShipIcon,
    Plus, X, Edit3, RefreshCw,
    Calendar, MapPin, Building2, Weight, MessageSquare
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
const QUICK_RATING_TAGS = [
    '⚡ Bốc dỡ nhanh',
    '🚢 Thuyền trưởng hỗ trợ tốt',
    '⚓ Cập cầu thuận lợi',
    '📦 Hàng sạch đẹp',
    '⚠️ Cẩu yếu / Chậm',
    '⏳ Chờ cầu lâu'
];

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
                {/* ── 1. Top Navbar tinh giản & đầy đủ tiện ích ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: 14, color: '#ffffff', marginBottom: 10,
                    boxShadow: '0 4px 14px rgba(15,23,42,0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                width: 32, height: 32, borderRadius: 8, border: 'none',
                                background: 'rgba(255,255,255,0.12)', color: '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                            title="Màn hình chính"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                                Cập Nhật Tàu
                            </h1>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                                {filteredShips.length} tàu • Cafe, Tally, Đánh giá
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                            onClick={() => refresh()}
                            title="Làm mới dữ liệu"
                            style={{
                                width: 32, height: 32, borderRadius: 8, border: 'none',
                                background: 'rgba(255,255,255,0.12)', color: '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <RefreshCw size={13} className={loading ? 'spin' : ''} />
                        </button>
                        <button
                            onClick={handleOpenNew}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '6px 11px', borderRadius: 8,
                                background: '#10b981', border: 'none', color: '#ffffff',
                                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                            }}
                        >
                            <Plus size={14} strokeWidth={2.5} /> Nhập tàu
                        </button>
                    </div>
                </div>

                {/* ── Toast Success ── */}
                {toastMsg && (
                    <div style={{
                        background: '#ecfdf5', border: '1.5px solid #10b981',
                        borderRadius: 12, padding: '10px 12px', marginBottom: 10,
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: '#065f46', fontSize: 12.5, fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(16,185,129,0.12)'
                    }}>
                        <CheckCircle2 size={16} color="#10b981" />
                        <span>{toastMsg}</span>
                    </div>
                )}

                {/* ── 2. Ô tìm kiếm thanh mảnh ── */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo tên tàu, cảng, khách hàng..."
                        style={{
                            width: '100%', padding: '9px 12px 9px 34px',
                            borderRadius: 10, border: '1px solid #cbd5e1',
                            background: '#ffffff', fontSize: 13, outline: 'none',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box'
                        }}
                    />
                    <div style={{ position: 'absolute', left: 11, top: 10, color: '#94a3b8' }}>
                        <Search size={15} />
                    </div>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute', right: 10, top: 8,
                                border: 'none', background: '#f1f5f9', borderRadius: '50%',
                                width: 20, height: 20, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', color: '#64748b'
                            }}
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* ── 3. Bộ lọc tab thu nhỏ tiện lợi ── */}
                <div style={{
                    display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 4,
                    marginBottom: 10, scrollbarWidth: 'none'
                }}>
                    <button
                        onClick={() => setFilterTab('all')}
                        style={{
                            padding: '5px 10px', borderRadius: 8, border: 'none',
                            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'all' ? '#0f172a' : '#ffffff',
                            color: filterTab === 'all' ? '#ffffff' : '#64748b',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                    >
                        Tất cả ({counts.all})
                    </button>
                    <button
                        onClick={() => setFilterTab('has_cafe')}
                        style={{
                            padding: '5px 10px', borderRadius: 8,
                            border: filterTab === 'has_cafe' ? 'none' : '1px solid #fde68a',
                            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'has_cafe' ? '#d97706' : '#fffbeb',
                            color: filterTab === 'has_cafe' ? '#ffffff' : '#b45309',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        ☕ Có cafe ({counts.has_cafe})
                    </button>
                    <button
                        onClick={() => setFilterTab('no_cafe')}
                        style={{
                            padding: '5px 10px', borderRadius: 8,
                            border: filterTab === 'no_cafe' ? 'none' : '1px solid #fca5a5',
                            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'no_cafe' ? '#dc2626' : '#fef2f2',
                            color: filterTab === 'no_cafe' ? '#ffffff' : '#b91c1c',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        ☕ Chưa có cafe ({counts.no_cafe})
                    </button>
                    <button
                        onClick={() => setFilterTab('has_tally')}
                        style={{
                            padding: '5px 10px', borderRadius: 8,
                            border: filterTab === 'has_tally' ? 'none' : '1px solid #bfdbfe',
                            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'has_tally' ? '#2563eb' : '#eff6ff',
                            color: filterTab === 'has_tally' ? '#ffffff' : '#1d4ed8',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        📋 Có tally ({counts.has_tally})
                    </button>
                    <button
                        onClick={() => setFilterTab('no_tally')}
                        style={{
                            padding: '5px 10px', borderRadius: 8,
                            border: filterTab === 'no_tally' ? 'none' : '1px solid #fca5a5',
                            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'no_tally' ? '#dc2626' : '#fef2f2',
                            color: filterTab === 'no_tally' ? '#ffffff' : '#b91c1c',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        📋 Chưa có tally ({counts.no_tally})
                    </button>
                    <button
                        onClick={() => setFilterTab('has_rating')}
                        style={{
                            padding: '5px 10px', borderRadius: 8,
                            border: filterTab === 'has_rating' ? 'none' : '1px solid #fef08a',
                            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: filterTab === 'has_rating' ? '#ca8a04' : '#ffffff',
                            color: filterTab === 'has_rating' ? '#ffffff' : '#854d0e',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        ⭐ Có đánh giá ({counts.has_rating})
                    </button>
                </div>

                {/* ── 4. DANH SÁCH THẺ TÀU TINH GIẢN - GỌN GÀNG, ĐẦY ĐỦ THÔNG TIN ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredShips.length === 0 ? (
                        <div style={{
                            background: '#ffffff', borderRadius: 16, padding: '28px 16px',
                            textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0'
                        }}>
                            <ShipIcon size={32} color="#cbd5e1" style={{ margin: '0 auto 6px' }} />
                            <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', color: '#1e293b' }}>
                                Không tìm thấy chuyến tàu nào
                            </p>
                            <p style={{ fontSize: 12, margin: 0 }}>
                                Bấm nút "+ Nhập tàu" bên trên để thêm tàu mới.
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
                                    onClick={() => handleOpenEdit(s)}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: 14,
                                        border: hasNeither ? '1.5px solid #fecaca' : (hasBoth ? '1.5px solid #bbf7d0' : '1.5px solid #fed7aa'),
                                        boxShadow: hasNeither ? '0 2px 8px rgba(239,68,68,0.04)' : '0 2px 8px rgba(0,0,0,0.02)',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        padding: '11px 13px 11px 16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {/* Dải màu mép trái nhận diện: Xanh = Đủ cả 2, Vàng = Có 1 trong 2, Đỏ = Chưa có cả 2 */}
                                    <div style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                                        background: accentColor
                                    }} />

                                    {/* Dòng 1: Tên tàu + Trạng thái & Nút Sửa */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 7 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: 8,
                                                background: hasBoth ? '#f0fdf4' : (hasNeither ? '#fef2f2' : '#fffbeb'),
                                                border: hasBoth ? '1px solid #bbf7d0' : (hasNeither ? '1px solid #fecaca' : '1px solid #fde68a'),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: hasBoth ? '#15803d' : (hasNeither ? '#dc2626' : '#d97706'),
                                                flexShrink: 0
                                            }}>
                                                <ShipIcon size={16} />
                                            </div>
                                            <h3 style={{
                                                fontSize: 15, fontWeight: 800, color: '#0f172a',
                                                margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                            }}>
                                                {s.name}
                                            </h3>
                                            {s.hasBarge && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                                                    background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', flexShrink: 0
                                                }}>
                                                    +{s.bargeCount || 1} xà lan
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                                            <span style={{
                                                padding: '2px 7px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                                                background: statusCfg.bg, color: statusCfg.color, whiteSpace: 'nowrap'
                                            }}>
                                                {statusCfg.label}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(s); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 3,
                                                    padding: '3px 8px', borderRadius: 6,
                                                    background: '#ecfdf5', border: '1px solid #a7f3d0',
                                                    color: '#047857', fontSize: 11, fontWeight: 700,
                                                    cursor: 'pointer', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                <Edit3 size={11} /> Sửa
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dòng 2: Khung 4 thông số gọn gàng (Ngày vào • Sản lượng • Cảng dỡ • Khách hàng) */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '3px 8px',
                                        padding: '6px 9px',
                                        background: '#f8fafc',
                                        borderRadius: 8,
                                        border: '1px solid #e2e8f0',
                                        marginBottom: 7,
                                        fontSize: 11.5
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                                            <Calendar size={12} color="#64748b" style={{ flexShrink: 0 }} />
                                            <span style={{ color: '#64748b' }}>Vào:</span>
                                            <strong style={{ color: '#1e293b', whiteSpace: 'nowrap' }}>{arrDate}</strong>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                                            <Weight size={12} color="#d97706" style={{ flexShrink: 0 }} />
                                            <span style={{ color: '#64748b' }}>Lượng:</span>
                                            <strong style={{ color: '#b45309', whiteSpace: 'nowrap' }}>
                                                {s.weight ? `${s.weight.toLocaleString('vi-VN')} tấn` : '0 tấn'}
                                            </strong>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                                            <MapPin size={12} color="#0284c7" style={{ flexShrink: 0 }} />
                                            <span style={{ color: '#64748b' }}>Cảng:</span>
                                            <strong style={{ color: '#0369a1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {s.port || 'Sowatco LB'}
                                            </strong>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                                            <Building2 size={12} color="#059669" style={{ flexShrink: 0 }} />
                                            <span style={{ color: '#64748b' }}>Khách:</span>
                                            <strong style={{ color: '#047857', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {s.client || '—'}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* Dòng 3: Dải Cafe & Tally - 2 Cột Song Song 50/50 (CÓ = Nổi bật vàng/xanh kèm note, KHÔNG = Đỏ rõ ràng) */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 6,
                                        marginBottom: (s.rating || s.ratingComment) ? 7 : 0
                                    }}>
                                        {/* Nhãn Cafe */}
                                        <div style={{
                                            padding: '5px 8px', borderRadius: 8,
                                            background: s.hasCafeFee ? '#fffbeb' : '#fef2f2',
                                            border: s.hasCafeFee ? '1px solid #fde68a' : '1px solid #fecaca',
                                            minWidth: 0
                                        }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                color: s.hasCafeFee ? '#92400e' : '#b91c1c',
                                                fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap'
                                            }}>
                                                <span style={{ flexShrink: 0 }}>☕</span>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {s.hasCafeFee ? `Có: ${formatVNCurrency(s.cafeFee || 0)}đ` : 'Không có cafe'}
                                                </span>
                                            </div>
                                            {s.hasCafeFee && s.cafeNote && (
                                                <div style={{
                                                    fontSize: 10, color: '#78350f', marginTop: 2,
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                }}>
                                                    📝 {s.cafeNote}
                                                </div>
                                            )}
                                        </div>

                                        {/* Nhãn Tally */}
                                        <div style={{
                                            padding: '5px 8px', borderRadius: 8,
                                            background: s.hasTally ? '#eff6ff' : '#fef2f2',
                                            border: s.hasTally ? '1px solid #bfdbfe' : '1px solid #fecaca',
                                            minWidth: 0
                                        }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                color: s.hasTally ? '#1e40af' : '#b91c1c',
                                                fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap'
                                            }}>
                                                <span style={{ flexShrink: 0 }}>📋</span>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {s.hasTally ? `Có: ${formatVNCurrency(s.tallyFee || 0)}đ` : 'Không có tally'}
                                                </span>
                                            </div>
                                            {s.hasTally && s.tallyNote && (
                                                <div style={{
                                                    fontSize: 10, color: '#1e3a8a', marginTop: 2,
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                }}>
                                                    👤 {s.tallyNote}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dòng 4: Đánh giá & Toàn bộ nội dung nhận xét (Rộng rãi, hiển thị trọn vẹn) */}
                                    {s.rating || s.ratingComment ? (
                                        <div
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(s); }}
                                            style={{
                                                paddingTop: 8,
                                                borderTop: '1px dashed #e2e8f0',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 6,
                                                cursor: 'pointer'
                                            }}
                                            title="Nhấn để xem hoặc cập nhật đánh giá tàu"
                                        >
                                            {/* Hàng sao & Phân loại */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 6,
                                                flexWrap: 'wrap'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                                        {[1, 2, 3, 4, 5].map(num => (
                                                            <Star
                                                                key={num}
                                                                size={13.5}
                                                                fill={num <= (s.rating || 0) ? '#f59e0b' : 'none'}
                                                                color={num <= (s.rating || 0) ? '#d97706' : '#cbd5e1'}
                                                                strokeWidth={num <= (s.rating || 0) ? 1 : 1.5}
                                                            />
                                                        ))}
                                                    </div>
                                                    {s.rating ? (
                                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>
                                                            {s.rating}.0
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {s.rating && STAR_LABELS[s.rating] && (
                                                    <span style={{
                                                        fontSize: 10.5,
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: 6,
                                                        background: STAR_LABELS[s.rating].bg,
                                                        color: STAR_LABELS[s.rating].color,
                                                        border: `1px solid ${STAR_LABELS[s.rating].color}35`,
                                                        flexShrink: 0
                                                    }}>
                                                        {STAR_LABELS[s.rating].text}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Hộp nhận xét hiển thị trọn vẹn 100% nội dung (không bị cắt bớt) */}
                                            {s.ratingComment && (
                                                <div style={{
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderLeft: '3.5px solid #f59e0b',
                                                    borderRadius: 7,
                                                    padding: '7px 10px',
                                                    fontSize: 12,
                                                    lineHeight: 1.5,
                                                    color: '#334155',
                                                    wordBreak: 'break-word',
                                                    whiteSpace: 'pre-wrap',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 6
                                                }}>
                                                    <MessageSquare size={13.5} color="#d97706" style={{ flexShrink: 0, marginTop: 2.5 }} />
                                                    <div style={{ flex: 1, fontStyle: 'italic', fontWeight: 500 }}>
                                                        "{s.ratingComment}"
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(s); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                paddingTop: 6, borderTop: '1px dashed #f1f5f9',
                                                fontSize: 11, color: '#94a3b8', cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Star size={11} fill="none" color="#cbd5e1" />
                                                <span>Chưa có đánh giá</span>
                                            </div>
                                            <span style={{ color: '#059669', fontWeight: 700 }}>+ Đánh giá</span>
                                        </div>
                                    )}
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

                                {/* PHẦN 1: ĐÁNH GIÁ & NHẬN XÉT (THIẾT KẾ TINH TẾ) */}
                                <div style={{
                                    background: 'linear-gradient(180deg, #ffffff 0%, #fffdf5 100%)',
                                    borderRadius: 16, padding: '14px 16px',
                                    border: '1px solid #fef08a', marginBottom: 14,
                                    boxShadow: '0 2px 8px rgba(245,158,11,0.06)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Star size={16} color="#d97706" fill="#f59e0b" />
                                            <span style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>1. Đánh giá chất lượng tàu</span>
                                        </div>
                                        {rating > 0 && STAR_LABELS[rating] && (
                                            <span style={{
                                                fontSize: 11, fontWeight: 700,
                                                padding: '2px 8px', borderRadius: 99,
                                                background: STAR_LABELS[rating].bg,
                                                color: STAR_LABELS[rating].color,
                                                border: `1px solid ${STAR_LABELS[rating].color}30`
                                            }}>
                                                {rating}⭐ {STAR_LABELS[rating].text}
                                            </span>
                                        )}
                                    </div>

                                    {/* Stars Bar */}
                                    <div style={{
                                        display: 'flex', gap: 10, justifyContent: 'center',
                                        alignItems: 'center', padding: '6px 0 10px 0'
                                    }}>
                                        {[1, 2, 3, 4, 5].map(starNum => {
                                            const active = rating >= starNum;
                                            return (
                                                <button
                                                    key={starNum}
                                                    type="button"
                                                    onClick={() => setRating(rating === starNum ? 0 : starNum)}
                                                    style={{
                                                        border: 'none', background: 'none', cursor: 'pointer',
                                                        padding: 4, transition: 'transform .15s'
                                                    }}
                                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <Star
                                                        size={30}
                                                        fill={active ? '#f59e0b' : 'none'}
                                                        color={active ? '#d97706' : '#cbd5e1'}
                                                        strokeWidth={active ? 1 : 1.5}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Gợi ý nhận xét nhanh (Quick Tags) */}
                                    <div style={{ marginBottom: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', display: 'block', marginBottom: 5 }}>
                                            Gợi ý nhận xét nhanh (chạm để chọn):
                                        </span>
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                            {QUICK_RATING_TAGS.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => {
                                                        const cleanTag = tag.replace(/^[^\w\s\u00C0-\u1EF9]+/u, '').trim();
                                                        if (!ratingComment) {
                                                            setRatingComment(cleanTag);
                                                        } else if (!ratingComment.includes(cleanTag)) {
                                                            setRatingComment(`${ratingComment}, ${cleanTag}`);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                                        background: '#ffffff', color: '#78350f',
                                                        border: '1px solid #fde68a', cursor: 'pointer',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                                    }}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <textarea
                                        value={ratingComment}
                                        onChange={e => setRatingComment(e.target.value)}
                                        placeholder="Ghi chú nhận xét tàu (tình trạng hầm hàng, cẩu bốc dỡ, thuyền trưởng...)"
                                        rows={2}
                                        style={{
                                            width: '100%', padding: '8px 10px', borderRadius: 10,
                                            border: '1px solid #fde68a', background: '#ffffff',
                                            fontSize: 12.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
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
                                            <ClipboardList size={18} color="#2563eb" />
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
