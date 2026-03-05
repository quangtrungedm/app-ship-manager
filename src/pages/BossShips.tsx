import { useState, useMemo } from 'react';
import { MobileLayout } from '../components/MobileLayout';
import { useShips } from '../lib/useShips';
import { Ship } from '../types';
import { FileText, Calendar, Weight, Download, ChevronDown, ChevronUp, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

function formatMonthLabel(ym: string) {
    const [y, m] = ym.split('-');
    const names = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return `${names[parseInt(m)]} ${y}`;
}

function BossShipCard({ ship }: { ship: Ship }) {
    const [filesOpen, setFilesOpen] = useState(false);
    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 700, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: 8 }}>{ship.name}</p>
                <span className="badge badge-completed" style={{ flexShrink: 0 }}>
                    <CheckCircle size={11} /> Đã hoàn thành
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, marginBottom: ship.documents.length > 0 ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} color="var(--c-primary)" />
                    <span style={{ color: 'var(--c-text-secondary)', width: 75 }}>Ngày vào:</span>
                    <span style={{ fontWeight: 600 }}>{fmtDate(ship.arrivalDate)}</span>
                </div>
                {ship.completionDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={14} color="var(--c-success)" />
                        <span style={{ color: 'var(--c-text-secondary)', width: 75 }}>Ngày xong:</span>
                        <span style={{ fontWeight: 600 }}>{fmtDate(ship.completionDate)}</span>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Weight size={14} color="var(--c-warning)" />
                    <span style={{ color: 'var(--c-text-secondary)', width: 75 }}>Sản lượng:</span>
                    <span style={{ fontWeight: 600 }}>{ship.weight.toLocaleString()} tấn</span>
                </div>
            </div>

            {ship.documents.length > 0 && (
                <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 10 }}>
                    <button onClick={() => setFilesOpen(!filesOpen)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        padding: '6px 0', color: 'var(--c-primary)', fontSize: 13, fontWeight: 600,
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={15} /> Giấy tờ ({ship.documents.length} file)
                        </span>
                        {filesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {filesOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                            {ship.documents.map(doc => (
                                <a key={doc.id} href={doc.url} download style={{
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
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [pickerOpen, setPickerOpen] = useState(false);
    const now = new Date();
    const [pickerYear, setPickerYear] = useState(now.getFullYear());

    const filteredShips = useMemo(() => {
        if (selectedMonth === 'all') return ships;
        return ships.filter(s => {
            const d = new Date(s.arrivalDate);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
        });
    }, [ships, selectedMonth]);

    return (
        <MobileLayout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{filteredShips.length} chuyến tàu · Chỉ xem</p>
                {loading && <Loader2 size={12} className="spin" color="var(--c-primary)" />}
            </div>

            {/* Month Picker */}
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
                            <button onClick={() => setPickerYear(y => y - 1)} style={{ border: 'none', background: 'var(--c-bg)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}>
                                <ChevronLeft size={15} />
                            </button>
                            <span style={{ fontSize: 14, fontWeight: 800 }}>{pickerYear}</span>
                            <button onClick={() => setPickerYear(y => y + 1)} style={{ border: 'none', background: 'var(--c-bg)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}>
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
                                        transition: 'all .15s',
                                    }}>{label}</button>
                                );
                            })}
                        </div>
                        <button onClick={() => { setSelectedMonth('all'); setPickerOpen(false); }} style={{
                            width: '100%', padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                            fontFamily: 'inherit', fontSize: 12, fontWeight: selectedMonth === 'all' ? 700 : 500,
                            background: selectedMonth === 'all' ? 'var(--c-primary)' : 'var(--c-bg)',
                            color: selectedMonth === 'all' ? '#fff' : 'var(--c-text-secondary)',
                        }}>Tất cả</button>
                    </div>
                )}
            </div>

            {filteredShips.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-secondary)', fontSize: 14 }}>Không có tàu trong tháng này</div>
            ) : (
                filteredShips.map(s => <BossShipCard key={s.id} ship={s} />)
            )}
        </MobileLayout>
    );
}
