import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { useShips } from '../lib/useShips';
import { TrendingUp, Anchor, Calendar, Wallet, CheckCircle, Clock, ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
const SHORT_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const GRID_MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

const glassStyle = {
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.03)',
    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative' as const
};

export function StaffOverview() {
    const navigate = useNavigate();
    const { ships } = useShips();
    const now = new Date();
    const [selYear, setSelYear] = useState(now.getFullYear());
    const [selMonth, setSelMonth] = useState(now.getMonth());
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(now.getFullYear());

    const selectedShips = useMemo(() => ships.filter(s => {
        const d = new Date(s.arrivalDate);
        return d.getFullYear() === selYear && d.getMonth() === selMonth;
    }), [ships, selYear, selMonth]);

    const completedSelectedShips = useMemo(() =>
        selectedShips.filter(s => s.status === 'completed' || !!s.completionDate)
        , [selectedShips]);

    const selectedWeight = completedSelectedShips.reduce((a, s) => a + s.weight, 0);
    const selectedPaidWeight = completedSelectedShips.filter(s => s.isPaid).reduce((a, s) => a + s.weight, 0);

    // Sat Thep calculations (500 VND/ton)
    const totalSalary = selectedWeight * 500;
    const paidSalary = selectedPaidWeight * 500;
    const unpaidSalary = totalSalary - paidSalary;

    const globalUnpaidShips = useMemo(() => ships.filter(s => s.isPaid === false && (s.status === 'completed' || !!s.completionDate)), [ships]);
    const globalUnpaidCount = globalUnpaidShips.length;
    const globalUnpaidSalary = globalUnpaidShips.reduce((a, s) => a + s.weight * 500, 0);

    const handlePickMonth = (m: number) => {
        setSelMonth(m);
        setSelYear(pickerYear);
        setPickerOpen(false);
    };

    return (
        <MobileLayout>
            {/* ── Month Picker ── */}
            <div className="fade-up" style={{ ...glassStyle, marginBottom: 20 }}>
                <button
                    onClick={() => { setPickerOpen(!pickerOpen); setPickerYear(selYear); }}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        width: '100%', padding: '16px', border: 'none', background: 'transparent',
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    <Calendar size={18} color="var(--c-primary)" strokeWidth={2.5} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{MONTH_NAMES[selMonth]} {selYear}</span>
                    <ChevronDown size={18} color="#94a3b8" strokeWidth={2.5} style={{ transition: 'transform .3s cubic-bezier(0.4, 0, 0.2, 1)', transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                <div style={{
                    display: 'grid', gridTemplateRows: pickerOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 20px 20px' }}>
                            <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 16 }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <button onClick={() => setPickerYear(y => y - 1)} style={{ border: 'none', background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.1s', WebkitTapHighlightColor: 'transparent' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    <ChevronLeft size={16} color="#475569" strokeWidth={3} />
                                </button>
                                <span style={{ fontSize: 16, fontWeight: 800, color: '#334155' }}>Năm {pickerYear}</span>
                                <button onClick={() => setPickerYear(y => y + 1)} style={{ border: 'none', background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.1s', WebkitTapHighlightColor: 'transparent' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    <ChevronRight size={16} color="#475569" strokeWidth={3} />
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                {GRID_MONTHS.map((label, i) => {
                                    const isActive = selMonth === i && selYear === pickerYear;
                                    const isCurrent = now.getMonth() === i && now.getFullYear() === pickerYear;
                                    return (
                                        <button key={i} onClick={() => handlePickMonth(i)} style={{
                                            padding: '12px 0', borderRadius: 14, border: isCurrent && !isActive ? '2px solid rgba(59,130,246,0.3)' : '2px solid transparent',
                                            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 800 : 600,
                                            background: isActive ? 'var(--c-primary)' : 'rgba(0,0,0,0.02)',
                                            color: isActive ? '#fff' : '#64748b',
                                            boxShadow: isActive ? '0 4px 12px rgba(59,130,246,0.25)' : 'none',
                                            transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                            WebkitTapHighlightColor: 'transparent'
                                        }}
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        >{label}</button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div key={`cards-${selMonth}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div className="fade-up fade-up-d1" style={{ ...glassStyle, padding: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 16, background: 'linear-gradient(135deg, #4f46e5, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 8px 16px -4px rgba(79,70,229,0.4)' }}>
                        <Anchor size={22} color="#fff" strokeWidth={2.5} />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontWeight: 700, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tàu hoàn thành</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--c-text)', margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>{completedSelectedShips.length}</p>
                </div>
                <div className="fade-up fade-up-d2" style={{ ...glassStyle, padding: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 16, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 8px 16px -4px rgba(5,150,105,0.4)' }}>
                        <TrendingUp size={22} color="#fff" strokeWidth={2.5} />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontWeight: 700, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sản lượng</p>
                    <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-text)', margin: 0, letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {selectedWeight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })}
                        <span style={{ fontSize: 14, color: 'var(--c-text-secondary)', fontWeight: 700, marginLeft: 4 }}>tấn</span>
                    </p>
                </div>
            </div>

            {/* ── Dashboard Content ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                {/* GLOBAL UNPAID WARNING WIDGET */}
                    {globalUnpaidCount > 0 && (
                        <div className="fade-up fade-up-d1" style={{
                            background: '#fff1f2',
                            border: '1px solid #ffe4e6',
                            boxShadow: '0 8px 30px -6px rgba(225, 29, 72, 0.15)',
                            padding: 16, borderRadius: 20,
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f43f5e, #fda4af)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(225,29,72,0.1)' }}>
                                        <Wallet size={20} color="#e11d48" strokeWidth={2.5} />
                                        <div style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: '#f43f5e', border: '2px solid #fff', animation: 'pulse 2s infinite' }} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 11, color: '#e11d48', margin: '0 0 2px 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tồn đọng</p>
                                        <p style={{ fontSize: 16, fontWeight: 800, color: '#9f1239', margin: 0, letterSpacing: '-0.3px' }}>Chưa thanh toán</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ background: '#ffffff', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: '#be123c', margin: '0 0 4px 0', fontWeight: 700 }}>{globalUnpaidCount} tàu chờ lương</p>
                                    <p style={{ fontSize: 24, color: '#e11d48', fontWeight: 800, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>{globalUnpaidSalary.toLocaleString('vi-VN')} đ</p>
                                </div>
                                <button
                                    onClick={() => navigate('/staff/ships', { state: { defaultTab: 'unpaid' } })} // <= 'staff' in staff file!
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff', border: 'none', borderRadius: 12,
                                        padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 8px 20px -6px rgba(225, 29, 72, 0.4)',
                                        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                        WebkitTapHighlightColor: 'transparent'
                                    }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    Rà soát <ArrowRight size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- IRON & STEEL: Cashflow Analytics (New Grid) --- */}
                    <div className="fade-up fade-up-d2" style={{ ...glassStyle, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(71,85,105,0.06)', border: '1px solid rgba(71,85,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Wallet size={20} color="#334155" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 800, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dòng tiền Sắt Thép</p>
                                <p style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--c-text)', letterSpacing: '-0.3px' }}>Tổng Lương {SHORT_MONTHS[selMonth]}</p>
                            </div>
                        </div>

                        {/* Total Expected Box */}
                        <div style={{ background: '#f8fafc', borderRadius: 16, padding: '16px', marginBottom: 12, border: '1px solid rgba(0,0,0,0.03)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dự chi nhân công (500đ/t)</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>
                                    {totalSalary.toLocaleString('vi-VN')}
                                </p>
                                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 800 }}>đ</span>
                            </div>
                        </div>

                        {/* Grid for Paid / Unpaid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: 16, padding: 14, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -8, right: -8, width: 50, height: 50, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: 6, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>
                                        <CheckCircle size={12} color="#fff" strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#065f46' }}>Đã TT</span>
                                </div>
                                <p style={{ fontSize: 18, fontWeight: 800, color: '#047857', margin: 0, letterSpacing: '-0.5px', lineHeight: 1 }}>
                                    {paidSalary.toLocaleString('vi-VN')}
                                </p>
                            </div>

                            <div style={{ background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: 16, padding: 14, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -8, right: -8, width: 50, height: 50, background: 'radial-gradient(circle, rgba(225,29,72,0.15) 0%, transparent 70%)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: 6, background: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(225,29,72,0.3)' }}>
                                        <Clock size={12} color="#fff" strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#9f1239' }}>Chưa TT</span>
                                </div>
                                <p style={{ fontSize: 18, fontWeight: 800, color: '#be123c', margin: 0, letterSpacing: '-0.5px', lineHeight: 1 }}>
                                    {unpaidSalary.toLocaleString('vi-VN')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>



        </MobileLayout>
    );
}
