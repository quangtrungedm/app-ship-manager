import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllShips } from '../lib/useAllShips';
import { uploadFile } from '../lib/api';
import { isConfigured } from '../lib/config';
import { Ship, Document as ShipDoc, ShipStatus } from '../types';
import {
    Plus, Calendar, Weight, X, Upload, FileText, Trash2,
    Ship as ShipIcon, CheckCircle, Loader2, Search, ArrowDownUp,
    Clock, ArrowRight, Anchor, User, MapPin, ExternalLink,
    LogOut, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import imageCompression from 'browser-image-compression';

const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const GRID_MONTHS = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];

function formatMonthLabel(ym: string) {
    const [y, m] = ym.split('-');
    return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

const PORTS = ['Sowatco Long Bình', 'Vĩnh Tân', 'Cần Giờ'];

const STATUS_CONFIG: Record<ShipStatus, { label: string; color: string; bg: string; icon: any; bar: string }> = {
    waiting:   { label: 'Đang neo',      color: '#b45309', bg: '#fef3c7', icon: Anchor,      bar: '#f59e0b' },
    entering:  { label: 'Đã cập bến',    color: '#1d4ed8', bg: '#dbeafe', icon: ArrowRight,  bar: '#3b82f6' },
    working:   { label: 'Đang làm',      color: '#7c3aed', bg: '#ede9fe', icon: Clock,       bar: '#8b5cf6' },
    completed: { label: 'Đã hoàn thành', color: '#15803d', bg: '#dcfce7', icon: CheckCircle, bar: '#22c55e' },
};

const STATUS_TABS: { key: 'all' | ShipStatus; label: string }[] = [
    { key: 'all',       label: 'Tất cả' },
    { key: 'waiting',   label: 'Đang neo' },
    { key: 'entering',  label: 'Đã cập' },
    { key: 'working',   label: 'Đang làm' },
    { key: 'completed', label: 'Hoàn thành' },
];

const removeAccents = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

const formatVNWeight = (value: string) => {
    let cleaned = value.replace(/[^0-9.,]/g, '');
    if (cleaned.endsWith('.') && !cleaned.slice(0, -1).includes(',')) cleaned = cleaned.slice(0, -1) + ',';
    let normalized = cleaned.replace(/\./g, '');
    const parts = normalized.split(',');
    let intPart = parts[0];
    const decPart = parts.length > 1 ? ',' + parts.slice(1).join('') : '';
    if (intPart.length > 1 && intPart.startsWith('0')) intPart = intPart.replace(/^0+/, '') || '0';
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return intPart + decPart;
};

function StatusBadge({ status = 'waiting' }: { status?: ShipStatus }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.waiting;
    const Icon = cfg.icon;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            color: cfg.color, background: cfg.bg, flexShrink: 0,
        }}>
            <Icon size={11} strokeWidth={2.5} /> {cfg.label}
        </span>
    );
}

function ShipCard({ ship, onClick }: { ship: Ship; onClick: () => void }) {
    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const cfg = STATUS_CONFIG[ship.status || 'waiting'];

    return (
        <div
            onClick={onClick}
            style={{
                cursor: 'pointer', marginBottom: 14, borderRadius: 20,
                background: '#fff', border: '1px solid rgba(0,0,0,0.04)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden',
                transition: 'transform 0.2s ease', position: 'relative',
                WebkitTapHighlightColor: 'transparent',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
        >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: cfg.bar }} />

            <div style={{ padding: '16px 18px 16px 20px' }}>
                {/* Row 1: Name + Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                    <p style={{
                        fontSize: 16, fontWeight: 800, color: '#0f172a', flex: 1, minWidth: 0,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        letterSpacing: '-0.3px', margin: 0,
                    }}>
                        {ship.name}
                    </p>
                    <StatusBadge status={ship.status} />
                </div>

                {/* Row 2: Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                    <InfoItem icon={<Calendar size={13} color="#4f46e5" strokeWidth={2.5} />} label="Ngày vào" value={fmtDate(ship.arrivalDate)} />
                    {ship.completionDate
                        ? <InfoItem icon={<Calendar size={13} color="#10b981" strokeWidth={2.5} />} label="Ngày xong" value={fmtDate(ship.completionDate)} />
                        : <InfoItem icon={<Calendar size={13} color="#94a3b8" strokeWidth={2.5} />} label="Ngày xong" value="—" />
                    }
                    <InfoItem icon={<Weight size={13} color="#f59e0b" strokeWidth={2.5} />} label="Sản lượng" value={`${ship.weight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn`} />
                    <InfoItem icon={<MapPin size={13} color="#ef4444" strokeWidth={2.5} />} label="Cảng" value={ship.port || '—'} />
                    {ship.employee && (
                        <InfoItem icon={<User size={13} color="#8b5cf6" strokeWidth={2.5} />} label="Nhân viên" value={ship.employee} />
                    )}
                    {ship.division && (
                        <InfoItem icon={<ShipIcon size={13} color="#64748b" strokeWidth={2.5} />} label="Mảng" value={ship.division === 'VIN_CAN_GIO' ? 'Vin Cần Giờ' : ship.division === 'SAT_THEP' ? 'Sắt Thép' : ship.division} />
                    )}
                </div>
            </div>

            {/* Footer: docs */}
            {ship.documents.length > 0 && (
                <div style={{
                    padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.04)',
                    background: 'rgba(0,0,0,0.015)',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <FileText size={13} color="#64748b" strokeWidth={2} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{ship.documents.length} tài liệu đính kèm</span>
                </div>
            )}
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                {icon} {value}
            </span>
        </div>
    );
}

export function BossManager() {
    const navigate = useNavigate();
    const { ships, loading, addShip, updateShip: updateShipApi, deleteShip } = useAllShips();
    const now = new Date();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Ship | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | ShipStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'weight-desc' | 'weight-asc'>('newest');
    const [submitting, setSubmitting] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Month picker
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(now.getFullYear());

    // Form state
    const [name, setName] = useState('');
    const [status, setStatus] = useState<ShipStatus>('waiting');
    const [arrival, setArrival] = useState('');
    const [completion, setCompletion] = useState('');
    const [weight, setWeight] = useState('');
    const [employee, setEmployee] = useState('');
    const [port, setPort] = useState('');
    const [docs, setDocs] = useState<ShipDoc[]>([]);

    // Stats
    const stats = useMemo(() => ({
        total: ships.length,
        waiting: ships.filter(s => (s.status || 'waiting') === 'waiting').length,
        entering: ships.filter(s => s.status === 'entering').length,
        working: ships.filter(s => s.status === 'working').length,
        completed: ships.filter(s => s.status === 'completed' || !!s.completionDate).length,
    }), [ships]);

    const filteredShips = useMemo(() => {
        let result = ships;
        if (searchQuery.trim()) {
            const q = removeAccents(searchQuery.toLowerCase());
            result = result.filter(s => removeAccents(s.name.toLowerCase()).includes(q)
                || (s.employee && removeAccents(s.employee.toLowerCase()).includes(q))
                || (s.port && removeAccents(s.port.toLowerCase()).includes(q))
            );
        } else {
            if (selectedMonth !== 'all') {
                result = result.filter(s => {
                    const d = new Date(s.arrivalDate);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
                });
            }
            if (activeTab !== 'all') {
                result = result.filter(s => (s.status || 'waiting') === activeTab);
            }
        }
        return [...result].sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime();
            if (sortBy === 'oldest') return new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime();
            if (sortBy === 'weight-desc') return b.weight - a.weight;
            if (sortBy === 'weight-asc') return a.weight - b.weight;
            return 0;
        });
    }, [ships, activeTab, searchQuery, sortBy, selectedMonth]);

    const openNew = () => {
        setEditing(null); setName(''); setStatus('waiting'); setArrival('');
        setCompletion(''); setWeight(''); setEmployee(''); setPort(''); setDocs([]);
        setPendingFiles([]);
        setShowForm(true);
    };

    const openEdit = (s: Ship) => {
        setEditing(s); setName(s.name); setStatus(s.status || 'waiting');
        setArrival(s.arrivalDate.split('T')[0]);
        setCompletion(s.completionDate?.split('T')[0] || '');
        setWeight(s.weight.toLocaleString('vi-VN', { maximumFractionDigits: 5 }));
        setEmployee(s.employee || '');
        setPort(s.port || '');
        setDocs([...s.documents]);
        setPendingFiles([]);
        setShowForm(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const fileArr = Array.from(files);
        setPendingFiles(prev => [...prev, ...fileArr]);
        const newDocs: ShipDoc[] = fileArr.map((f, i) => ({
            id: `doc-new-${Date.now()}-${i}`,
            name: f.name,
            url: URL.createObjectURL(f),
        }));
        setDocs(prev => [...prev, ...newDocs]);
        e.target.value = '';
    };

    const removeDoc = (id: string) => setDocs(prev => prev.filter(d => d.id !== id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const parsedWeight = parseFloat(weight.replace(/\./g, '').replace(/,/g, '.')) || 0;
        const tempId = editing?.id || `shp-boss-${Date.now()}`;

        const shipData: Ship = {
            id: tempId,
            name,
            arrivalDate: new Date(arrival).toISOString(),
            completionDate: completion ? new Date(completion).toISOString() : undefined,
            weight: parsedWeight,
            status,
            employee: employee || undefined,
            port: port || undefined,
            division: editing?.division,
            documents: [...docs],
            isPaid: editing?.isPaid,
            client: editing?.client,
        };

        if (editing) { updateShipApi(shipData); }
        else { addShip(shipData); }

        const currentPendingFiles = [...pendingFiles];
        const currentDocs = [...docs];
        setPendingFiles([]);
        setShowForm(false);
        setSubmitting(false);

        if (!isConfigured()) return;
        (async () => {
            try {
                let uploadedDocs = currentDocs.filter(d => !d.id.startsWith('doc-new-'));
                if (currentPendingFiles.length > 0) {
                    const uploadPromises = currentPendingFiles.map(async (file) => {
                        let fileToUpload = file;
                        if (file.type.startsWith('image/')) {
                            try { fileToUpload = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true }); }
                            catch { /* keep original */ }
                        }
                        return uploadFile(fileToUpload);
                    });
                    const newDocs = await Promise.all(uploadPromises);
                    uploadedDocs = [...uploadedDocs, ...newDocs];
                }
                await updateShipApi({ ...shipData, documents: uploadedDocs } as any);
            } catch (err) {
                console.error('Lỗi lưu ngầm:', err);
            }
        })();
    };

    const handleDelete = async () => {
        if (!editing) return;
        if (window.confirm('Bạn có chắc chắn muốn xóa chuyến tàu này?')) {
            await deleteShip(editing.id);
            setShowForm(false);
        }
    };

    return (
        <>
            <div style={{
                display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 500,
                margin: '0 auto', background: 'var(--c-bg)', position: 'relative', overflow: 'hidden',
            }}>
                {/* Header */}
                <header style={{
                    padding: '14px 20px',
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    position: 'sticky', top: 0, zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', letterSpacing: '.5px', textTransform: 'uppercase', margin: 0 }}>
                            Quản lý · Tổng hợp
                        </p>
                        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>Quản Lý Tổng</h1>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={openNew}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                border: 'none', borderRadius: 14, color: '#fff',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                            }}
                        >
                            <Plus size={16} strokeWidth={2.5} /> Thêm tàu
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            title="Đăng xuất"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 40, height: 40, border: 'none', borderRadius: 12,
                                background: '#fee2e2', color: '#dc2626', cursor: 'pointer', flexShrink: 0,
                            }}
                        >
                            <LogOut size={18} strokeWidth={2.5} style={{ marginLeft: -2 }} />
                        </button>
                    </div>
                </header>

                <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: 24 }}>
                    <div style={{ padding: '16px 16px 0' }}>

                        {/* Stats Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                            {([
                                { key: 'total', label: 'Tổng', value: stats.total, color: '#334155', bg: '#f1f5f9' },
                                { key: 'working', label: 'Đang làm', value: stats.working, color: '#7c3aed', bg: '#ede9fe' },
                                { key: 'entering', label: 'Đã cập', value: stats.entering, color: '#1d4ed8', bg: '#dbeafe' },
                                { key: 'completed', label: 'Xong', value: stats.completed, color: '#15803d', bg: '#dcfce7' },
                            ] as const).map(item => (
                                <div key={item.key} style={{
                                    background: item.bg, borderRadius: 16, padding: '12px 10px',
                                    textAlign: 'center',
                                }}>
                                    <p style={{ fontSize: 22, fontWeight: 800, color: item.color, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>{item.value}</p>
                                    <p style={{ fontSize: 10, color: item.color, fontWeight: 700, margin: '4px 0 0', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Month Picker */}
                        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12, overflow: 'hidden' }}>
                            <button
                                onClick={() => { setPickerOpen(!pickerOpen); setPickerYear(selectedMonth !== 'all' ? parseInt(selectedMonth.split('-')[0]) : now.getFullYear()); }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    width: '100%', padding: '11px 16px', border: 'none', background: 'transparent',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                <Calendar size={15} color="#7c3aed" />
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                                    {selectedMonth === 'all' ? 'Tất cả tháng' : formatMonthLabel(selectedMonth)}
                                </span>
                                <ChevronDown size={15} color="#94a3b8" style={{ transition: 'transform .2s', transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                            </button>
                            {pickerOpen && (
                                <div style={{ padding: '0 14px 14px' }}>
                                    <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 10 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <button onClick={() => setPickerYear(y => y - 1)} style={{ border: 'none', background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }} onMouseDown={e => e.currentTarget.style.transform='scale(0.92)'} onMouseUp={e => e.currentTarget.style.transform='scale(1)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}><ChevronLeft size={15} /></button>
                                        <span style={{ fontSize: 14, fontWeight: 800 }}>{pickerYear}</span>
                                        <button onClick={() => setPickerYear(y => y + 1)} style={{ border: 'none', background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }} onMouseDown={e => e.currentTarget.style.transform='scale(0.92)'} onMouseUp={e => e.currentTarget.style.transform='scale(1)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}><ChevronRight size={15} /></button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                                        {GRID_MONTHS.map((label, i) => {
                                            const key = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                                            const isActive = selectedMonth === key;
                                            const isCurrent = now.getMonth() === i && now.getFullYear() === pickerYear;
                                            return (
                                                <button key={i} onClick={() => { setSelectedMonth(key); setPickerOpen(false); }} style={{
                                                    padding: '9px 0', borderRadius: 10,
                                                    border: isCurrent && !isActive ? '2px solid #8b5cf6' : '2px solid transparent',
                                                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                                                    fontWeight: isActive ? 700 : 500,
                                                    background: isActive ? '#7c3aed' : 'rgba(0,0,0,0.03)',
                                                    color: isActive ? '#fff' : '#475569',
                                                    WebkitTapHighlightColor: 'transparent',
                                                    transition: 'all 0.15s ease',
                                                }}
                                                    onMouseDown={e => e.currentTarget.style.transform='scale(0.92)'}
                                                    onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                                                >{label}</button>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => { setSelectedMonth('all'); setPickerOpen(false); }} style={{
                                        width: '100%', padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        fontFamily: 'inherit', fontSize: 12, fontWeight: selectedMonth === 'all' ? 700 : 500,
                                        background: selectedMonth === 'all' ? '#7c3aed' : 'rgba(0,0,0,0.04)',
                                        color: selectedMonth === 'all' ? '#fff' : '#64748b',
                                    }}>Tất cả tháng</button>
                                </div>
                            )}
                        </div>

                        {/* Search + Sort */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={15} color="var(--c-text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    placeholder="Tìm tàu, nhân viên, cảng..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 12px 10px 34px', boxSizing: 'border-box',
                                        border: 'none', borderRadius: 12, background: '#fff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        fontSize: 13, fontFamily: 'inherit', color: 'var(--c-text)', outline: 'none',
                                    }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
                                        <X size={14} color="var(--c-text-secondary)" />
                                    </button>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as any)}
                                    style={{
                                        appearance: 'none', padding: '10px 34px 10px 12px',
                                        border: 'none', borderRadius: 12, background: '#fff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                                        color: 'var(--c-text)', outline: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="weight-desc">Sản lượng ↓</option>
                                    <option value="weight-asc">Sản lượng ↑</option>
                                </select>
                                <ArrowDownUp size={13} color="var(--c-text-secondary)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        {/* Status Filter Tabs */}
                        {!searchQuery && (
                            <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                                {STATUS_TABS.map(tab => {
                                    const active = activeTab === tab.key;
                                    const cfg = tab.key !== 'all' ? STATUS_CONFIG[tab.key as ShipStatus] : null;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            style={{
                                                flexShrink: 0, padding: '7px 14px',
                                                border: 'none', borderRadius: 10, cursor: 'pointer',
                                                fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 700 : 500,
                                                background: active ? (cfg ? cfg.bg : '#0f172a') : '#fff',
                                                color: active ? (cfg ? cfg.color : '#fff') : '#64748b',
                                                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                                                transition: 'all 0.2s ease',
                                                WebkitTapHighlightColor: 'transparent',
                                            }}
                                        >
                                            {tab.label}
                                            {tab.key !== 'all' && (
                                                <span style={{
                                                    marginLeft: 5, fontSize: 11, fontWeight: 700,
                                                    background: active ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.05)',
                                                    padding: '1px 6px', borderRadius: 6,
                                                }}>
                                                    {stats[tab.key as keyof typeof stats]}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Ship List */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', margin: 0 }}>
                                {filteredShips.length} chuyến tàu
                                {loading && <Loader2 size={12} className="spin" color="var(--c-primary)" style={{ marginLeft: 6 }} />}
                            </p>
                        </div>

                        {filteredShips.length === 0 ? (
                            <EmptyState
                                title={searchQuery ? 'Không tìm thấy' : 'Chưa có tàu'}
                                description={searchQuery ? `Không có kết quả cho "${searchQuery}"` : 'Chưa có chuyến tàu nào trong danh sách.'}
                            />
                        ) : (
                            filteredShips.map(s => <ShipCard key={s.id} ship={s} onClick={() => openEdit(s)} />)
                        )}
                    </div>
                </main>
            </div>

            {/* ── Bottom Sheet Form ── */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />

                        {/* Sheet Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShipIcon size={18} color="#7c3aed" />
                                </div>
                                <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{editing ? 'Cập nhật tàu' : 'Thêm tàu mới'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {editing && (
                                    <button className="btn btn-ghost btn-sm" onClick={handleDelete} style={{ padding: 6, color: 'var(--c-danger)' }}>
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)} style={{ padding: 6 }}><X size={20} /></button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Tên tàu + Trạng thái */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                                <div className="field">
                                    <label>Tên tàu</label>
                                    <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Ever Given" required />
                                </div>
                                <div className="field">
                                    <label>Trạng thái</label>
                                    <select
                                        value={status}
                                        onChange={e => {
                                            const s = e.target.value as ShipStatus;
                                            setStatus(s);
                                            if (s === 'completed' && !completion)
                                                setCompletion(new Date().toISOString().split('T')[0]);
                                        }}
                                        required
                                        style={{ padding: '10px 12px', border: '1px solid var(--c-border)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none', width: '100%' }}
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                            <option key={key} value={key}>{cfg.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Ngày vào + Ngày xong */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="field">
                                    <label>Ngày vào</label>
                                    <input type="date" value={arrival} onChange={e => setArrival(e.target.value)} required />
                                </div>
                                <div className="field">
                                    <label>Ngày xong</label>
                                    <input type="date" value={completion} onChange={e => setCompletion(e.target.value)} />
                                </div>
                            </div>

                            {/* Sản lượng */}
                            <div className="field">
                                <label>Sản lượng (tấn)</label>
                                <input
                                    value={weight}
                                    onChange={e => setWeight(formatVNWeight(e.target.value))}
                                    placeholder="VD: 10.000"
                                    inputMode="decimal"
                                    required
                                />
                            </div>

                            {/* Nhân viên + Cảng */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="field">
                                    <label>Nhân viên</label>
                                    <input
                                        value={employee}
                                        onChange={e => setEmployee(e.target.value)}
                                        placeholder="Tên nhân viên"
                                    />
                                </div>
                                <div className="field">
                                    <label>Cảng dỡ</label>
                                    <select
                                        value={port}
                                        onChange={e => setPort(e.target.value)}
                                        style={{ padding: '10px 12px', border: '1px solid var(--c-border)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none', width: '100%' }}
                                    >
                                        <option value="">— Chọn cảng —</option>
                                        {PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Upload files */}
                            <div className="field">
                                <label>Tài liệu đính kèm</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: docs.length > 0 ? 10 : 0 }}>
                                    {docs.map(doc => (
                                        <div key={doc.id} style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            background: 'var(--c-bg)', borderRadius: 10, padding: '6px 10px',
                                            border: '1px solid var(--c-border)', maxWidth: '100%',
                                        }}>
                                            <FileText size={13} color="var(--c-primary)" />
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                                style={{ fontSize: 12, color: 'var(--c-primary)', textDecoration: 'none', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}
                                                onClick={e => e.stopPropagation()}>
                                                {doc.name} <ExternalLink size={10} />
                                            </a>
                                            <button type="button" onClick={() => removeDoc(doc.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, display: 'flex' }}>
                                                <X size={13} color="var(--c-danger)" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} style={{ display: 'none' }} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    width: '100%', padding: '10px', border: '2px dashed var(--c-border)',
                                    borderRadius: 12, background: 'transparent', cursor: 'pointer',
                                    fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary)', fontFamily: 'inherit',
                                }}>
                                    <Upload size={16} /> Thêm tài liệu / ảnh
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    width: '100%', padding: '14px', border: 'none', borderRadius: 14,
                                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'inherit', marginTop: 8, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 8,
                                    boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                                    opacity: submitting ? 0.7 : 1,
                                }}
                            >
                                {submitting ? <Loader2 size={18} className="spin" /> : (editing ? 'Cập nhật' : 'Thêm tàu')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
