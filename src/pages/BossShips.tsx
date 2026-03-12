import { useState, useMemo } from 'react';
import { MobileLayout } from '../components/MobileLayout';
import { useShips } from '../lib/useShips';
import { useAuth } from '../lib/AuthContext';
import { Ship, ShipStatus } from '../types';
import { FileText, Calendar, Weight, Download, ChevronDown, ChevronUp, CheckCircle, ChevronLeft, ChevronRight, Loader2, Search, ArrowDownUp, Clock, ArrowRight } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

function formatMonthLabel(ym: string) {
    const [y, m] = ym.split('-');
    const names = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return `${names[parseInt(m)]} ${y}`;
}

const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const STATUS_CONFIG: Record<ShipStatus, { label: string, color: string, bg: string, icon: any }> = {
    waiting: { label: 'Chờ slot', color: '#b45309', bg: '#fef3c7', icon: Clock },
    entering: { label: 'Đã cập bến', color: '#1d4ed8', bg: '#dbeafe', icon: ArrowRight },
    completed: { label: 'Đã hoàn thành', color: '#15803d', bg: '#dcfce7', icon: CheckCircle },
};

function StatusBadge({ status = 'waiting', completionDate }: { status?: ShipStatus, completionDate?: string }) {
    // Legacy support: if completionDate exists but no status, treat as completed
    const actualStatus = completionDate && status === 'waiting' ? 'completed' : status;
    const config = STATUS_CONFIG[actualStatus] || STATUS_CONFIG.waiting;
    const Icon = config.icon;

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            color: config.color, background: config.bg, flexShrink: 0
        }}>
            <Icon size={12} strokeWidth={2.5} /> {config.label}
        </span>
    );
}

function BossShipCard({ ship }: { ship: Ship }) {
    const [filesOpen, setFilesOpen] = useState(false);
    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const isSatThep = ship.division === 'SAT_THEP';
    const salary = ship.weight * 500;

    let statusColor = 'var(--c-text-secondary)';
    if (ship.status === 'entering') statusColor = 'var(--c-warning)';
    if (ship.status === 'completed') statusColor = 'var(--c-success)';
    if (ship.status === 'waiting') statusColor = 'var(--c-danger)';

    return (
        <div className="card fade-up" style={{
            padding: 0, marginBottom: 16,
            background: 'var(--c-surface)',
            border: '1px solid rgba(0,0,0,0.03)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transformOrigin: 'center center',
            WebkitTapHighlightColor: 'transparent',
            position: 'relative',
        }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: statusColor }} />

            <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-text)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: 12, letterSpacing: '-0.3px' }}>
                        {ship.name}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <StatusBadge status={ship.status} completionDate={ship.completionDate} />
                        {isSatThep && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                                color: ship.isPaid ? '#15803d' : '#b91c1c',
                                background: ship.isPaid ? '#dcfce7' : '#fee2e2',
                            }}>
                                {ship.isPaid ? <CheckCircle size={12} strokeWidth={2.5} /> : <Clock size={12} strokeWidth={2.5} />}
                                {ship.isPaid ? 'Đã T.Toán' : 'Chưa T.Toán'}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ngày vào</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} color="var(--c-primary)" /> {fmtDate(ship.arrivalDate)}
                        </span>
                        {ship.completionDate && (
                            <>
                                <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>Ngày ra</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Calendar size={14} color="var(--c-success)" /> {fmtDate(ship.completionDate)}
                                </span>
                            </>
                        )}
                    </div>
                    {isSatThep && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cảng dỡ</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" x2="4" y1="22" y2="15"></line></svg>
                                {ship.port || '—'}
                            </span>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sản lượng</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Weight size={14} color="var(--c-warning)" /> {ship.weight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn
                        </span>
                    </div>
                    {isSatThep && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Khách hàng</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                {ship.client || '—'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {isSatThep && (
                <div style={{
                    padding: '12px 20px',
                    background: 'rgba(0,0,0,0.02)',
                    borderTop: '1px solid rgba(0,0,0,0.04)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--c-text-secondary)', fontSize: 12, fontWeight: 600 }}>TỔNG LƯƠNG</span>
                    </div>
                    <span style={{ fontWeight: 800, color: ship.isPaid ? 'var(--c-success)' : 'var(--c-danger)', fontSize: 16, letterSpacing: '-0.5px' }}>
                        {salary.toLocaleString('vi-VN')} đ
                    </span>
                </div>
            )}

            {!isSatThep && ship.documents.length > 0 && (
                <div style={{ padding: '0 20px 16px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: 'var(--c-text-secondary)' }}>
                        <FileText size={12} /> {ship.documents.length} giấy tờ
                    </span>
                </div>
            )}

            {ship.documents.length > 0 && (
                <div style={{ borderTop: '1px solid var(--c-border)', padding: '0 20px 10px 20px' }}>
                    <button onClick={(e) => { e.stopPropagation(); setFilesOpen(!filesOpen); }} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        padding: '12px 0 6px 0', color: 'var(--c-primary)', fontSize: 13, fontWeight: 600,
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={15} /> Giấy tờ ({ship.documents.length} file)
                        </span>
                        {filesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {filesOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                            {ship.documents.map(doc => (
                                <a key={doc.id} href={doc.url} download onClick={(e) => e.stopPropagation()} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                                    background: 'var(--c-bg)', borderRadius: 10, textDecoration: 'none', color: 'var(--c-text)',
                                    fontSize: 13, fontWeight: 500,
                                }}>
                                    <FileText size={16} color="var(--c-primary)" style={{ flexShrink: 0 }} />
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                                    <Download size={16} color="var(--c-text-secondary)" style={{ flexShrink: 0 }} />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function BossShips() {
    const { ships, loading } = useShips();
    const { division } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [activeTab, setActiveTab] = useState<'all' | 'unpaid'>('all');
    const [pickerOpen, setPickerOpen] = useState(false);
    const now = new Date();
    const [pickerYear, setPickerYear] = useState(now.getFullYear());

    // Search & Sort state
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'weight-desc' | 'weight-asc'>('newest');

    const filteredShips = useMemo(() => {
        let result = ships;

        // 1. Filter by Search Query (Global Search)
        if (searchQuery.trim() !== '') {
            const q = removeAccents(searchQuery.toLowerCase());
            result = result.filter(s => removeAccents(s.name.toLowerCase()).includes(q));
        } else {
            // 2. Filter by Tab & Month (Only if no search query)
            if (activeTab === 'unpaid') {
                result = result.filter(s => s.division === 'SAT_THEP' && s.isPaid === false && s.status === 'completed');
            } else if (selectedMonth !== 'all') {
                result = result.filter(s => {
                    const d = new Date(s.arrivalDate);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
                });
            }
        }

        // 3. Sort
        result = [...result].sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime();
            if (sortBy === 'oldest') return new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime();
            if (sortBy === 'weight-desc') return b.weight - a.weight;
            if (sortBy === 'weight-asc') return a.weight - b.weight;
            return 0;
        });

        return result;
    }, [ships, selectedMonth, searchQuery, sortBy, activeTab]);

    const handleExportExcel = () => {
        // Build CSV data
        const headers = ['Tên tàu', 'Ngày vào', 'Ngày xong', 'Sản lượng (tấn)', 'Trạng thái', 'Số lượng tài liệu'];
        const rows = filteredShips.map(s => {
            const arrDate = new Date(s.arrivalDate).toLocaleDateString('vi-VN');
            const compDate = s.completionDate ? new Date(s.completionDate).toLocaleDateString('vi-VN') : '';
            return [
                `"${s.name.replace(/"/g, '""')}"`, // escape quotes
                arrDate,
                compDate,
                s.weight.toString(),
                s.completionDate ? 'Đã hoàn thành' : 'Đang xử lý',
                s.documents.length.toString()
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        // Add UTF-8 BOM so Excel reads Vietnamese characters correctly
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        const monthLabel = selectedMonth === 'all' ? 'Tat_Ca' : selectedMonth;
        link.setAttribute('download', `Bao_Cao_San_Luong_Tau_${monthLabel}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <MobileLayout>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{filteredShips.length} chuyến tàu · Chỉ xem</p>
                    {loading && <Loader2 size={12} className="spin" color="var(--c-primary)" />}
                </div>
                <button
                    onClick={handleExportExcel}
                    className="btn"
                    style={{
                        background: 'var(--c-success)', color: '#fff',
                        padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 2px 8px rgba(34,197,94,.3)'
                    }}
                >
                    <Download size={15} /> Xuất Excel
                </button>
            </div>

            {/* Segmented Control for SAT_THEP */}
            {division === 'SAT_THEP' && (
                <div style={{ display: 'flex', background: 'var(--c-bg)', padding: 4, borderRadius: 12, marginBottom: 16 }}>
                    <button
                        onClick={() => setActiveTab('all')}
                        style={{
                            flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
                            fontFamily: 'inherit', fontSize: 13, fontWeight: activeTab === 'all' ? 700 : 500,
                            background: activeTab === 'all' ? '#fff' : 'transparent',
                            color: activeTab === 'all' ? 'var(--c-primary)' : 'var(--c-text-secondary)',
                            boxShadow: activeTab === 'all' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Tất cả tàu
                    </button>
                    <button
                        onClick={() => setActiveTab('unpaid')}
                        style={{
                            flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
                            fontFamily: 'inherit', fontSize: 13, fontWeight: activeTab === 'unpaid' ? 700 : 500,
                            background: activeTab === 'unpaid' ? '#ef4444' : 'transparent',
                            color: activeTab === 'unpaid' ? '#fff' : '#b91c1c',
                            boxShadow: activeTab === 'unpaid' ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Lương Chưa Thanh Toán
                    </button>
                </div>
            )}

            {/* Search & Sort Panel */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={16} color="var(--c-text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Tìm tên tàu..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px 10px 36px',
                            border: 'none', borderRadius: 12, background: 'var(--c-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            fontSize: 13, fontFamily: 'inherit', color: 'var(--c-text)', outline: 'none'
                        }}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--c-text-secondary)' }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    )}
                </div>
                <div style={{ position: 'relative' }}>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        style={{
                            appearance: 'none', padding: '10px 36px 10px 12px',
                            border: 'none', borderRadius: 12, background: 'var(--c-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            fontSize: 13, fontWeight: 600, fontFamily: 'inherit', color: 'var(--c-text)', outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="weight-desc">Sản lượng (Cao-Thấp)</option>
                        <option value="weight-asc">Sản lượng (Thấp-Cao)</option>
                    </select>
                    <ArrowDownUp size={14} color="var(--c-text-secondary)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* Month Picker (Hidden when looking at unpaid debts) */}
            {activeTab === 'all' && (
                <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
                    <button
                        onClick={() => { setPickerOpen(!pickerOpen); }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '10px 16px', border: 'none', background: 'transparent',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        <Calendar size={15} color="var(--c-primary)" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                            {selectedMonth === 'all' ? 'Tất cả tháng' : formatMonthLabel(selectedMonth)}
                        </span>
                        <ChevronDown size={15} color="var(--c-text-secondary)" style={{ transition: 'transform .2s', transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>

                    {pickerOpen && (
                        <div style={{ padding: '0 16px 14px' }}>
                            <div style={{ height: 1, background: 'var(--c-border)', marginBottom: 12 }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <button onClick={() => setPickerYear(y => y - 1)} style={{ border: 'none', background: 'var(--c-bg)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit', transition: 'all 0.1s', WebkitTapHighlightColor: 'transparent' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    <ChevronLeft size={15} />
                                </button>
                                <span style={{ fontSize: 14, fontWeight: 800 }}>{pickerYear}</span>
                                <button onClick={() => setPickerYear(y => y + 1)} style={{ border: 'none', background: 'var(--c-bg)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit', transition: 'all 0.1s', WebkitTapHighlightColor: 'transparent' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                                {['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'].map((label, i) => {
                                    const key = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                                    const isActive = selectedMonth === key;
                                    const isCurrent = now.getMonth() === i && now.getFullYear() === pickerYear;
                                    return (
                                        <button key={i} onClick={() => { setSelectedMonth(key); setPickerOpen(false); }} style={{
                                            padding: '9px 0', borderRadius: 10, border: isCurrent && !isActive ? '2px solid var(--c-primary)' : '2px solid transparent',
                                            cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: isActive ? 700 : 500,
                                            background: isActive ? 'var(--c-primary)' : 'var(--c-bg)',
                                            color: isActive ? '#fff' : 'var(--c-text)',
                                            transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                            WebkitTapHighlightColor: 'transparent'
                                        }}
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        >{label}</button>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => { setSelectedMonth('all'); setPickerOpen(false); }} style={{
                                    flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: 12, fontWeight: selectedMonth === 'all' ? 700 : 500,
                                    background: selectedMonth === 'all' ? 'var(--c-primary)' : 'var(--c-bg)',
                                    color: selectedMonth === 'all' ? '#fff' : 'var(--c-text-secondary)',
                                }}>Tất cả</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {filteredShips.length === 0 ? (
                <EmptyState
                    title={searchQuery ? 'Không tìm thấy tàu' : 'Không có tàu'}
                    description={searchQuery ? `Không có kết quả nào cho "${searchQuery}"` : 'Không có tàu nào cập bến trong khoảng thời gian này.'}
                />
            ) : (
                filteredShips.map(s => <BossShipCard key={s.id} ship={s} />)
            )}
        </MobileLayout>
    );
}
