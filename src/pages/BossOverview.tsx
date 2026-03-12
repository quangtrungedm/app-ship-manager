import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { useShips } from '../lib/useShips';
import { useAuth } from '../lib/AuthContext';
import { MONTHLY_KPI_TARGET } from '../data/mockShips';
import { TrendingUp, Target, Anchor, BarChart3, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Trophy, ChevronDown, Calendar, Wallet, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

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

export function BossOverview() {
    const navigate = useNavigate();
    const { ships } = useShips();
    const { division } = useAuth();
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
    const isSatThep = division === 'SAT_THEP';
    const totalSalary = selectedWeight * 500;
    const paidSalary = selectedPaidWeight * 500;
    const unpaidSalary = totalSalary - paidSalary;

    const globalUnpaidShips = useMemo(() => ships.filter(s => s.division === 'SAT_THEP' && s.isPaid === false && (s.status === 'completed' || !!s.completionDate)), [ships]);
    const globalUnpaidCount = globalUnpaidShips.length;
    const globalUnpaidSalary = globalUnpaidShips.reduce((a, s) => a + s.weight * 500, 0);

    const kpiPercent = Math.min(100, Math.round((selectedWeight / MONTHLY_KPI_TARGET) * 100));
    const kpiReached = selectedWeight >= MONTHLY_KPI_TARGET;

    const yearMonthlyData = useMemo(() => {
        const data = Array.from({ length: 12 }, (_, i) => ({
            key: `${selYear}-${String(i + 1).padStart(2, '0')}`,
            month: SHORT_MONTHS[i],
            shipCount: 0,
            weight: 0
        }));

        ships.forEach(s => {
            const d = new Date(s.arrivalDate);
            if (d.getFullYear() === selYear) {
                const m = d.getMonth();
                if (s.status === 'completed' || !!s.completionDate) {
                    data[m].shipCount++;
                    data[m].weight += s.weight;
                }
            }
        });
        return data;
    }, [ships, selYear]);

    const maxWeight = Math.max(...yearMonthlyData.map(d => d.weight), MONTHLY_KPI_TARGET * 1.1);

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

            {/* ── Conditional Dashboard Content ── */}
            {isSatThep ? (
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
                                    onClick={() => navigate('/boss/ships', { state: { defaultTab: 'unpaid' } })}
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
            ) : (
                // --- VIN CAN GIO: KPI Analytics ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                    {/* KPI Progress */}
                    <div key={`kpi-${selMonth}`} className="fade-up fade-up-d2" style={{ ...glassStyle, padding: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Target size={20} color="var(--c-primary)" strokeWidth={2.5} />
                                <p style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: 'var(--c-text)' }}>KPI {MONTH_NAMES[selMonth]} {selYear}</p>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: kpiReached ? 'var(--c-success)' : 'var(--c-warning)' }}>{kpiPercent}%</span>
                        </div>
                        <div style={{ padding: '0 24px' }}>
                            <div style={{ height: 12, background: 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                                <div className="animate-fill" style={{ height: '100%', borderRadius: 99, width: `${kpiPercent}%`, background: kpiReached ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#f59e0b,#ea580c)', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-text-secondary)', marginTop: 8, paddingBottom: 20, fontWeight: 600 }}>
                                <span>0</span>
                                <span>Mục tiêu: {MONTHLY_KPI_TARGET.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn</span>
                            </div>
                        </div>
                        {kpiReached ? (
                            <div style={{ background: 'rgba(220, 252, 231, 0.4)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(187, 247, 208, 0.5)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
                                        <Trophy size={20} color="#fff" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 800, color: '#15803d', margin: 0 }}>Vượt chỉ tiêu!</p>
                                        <p style={{ fontSize: 12, color: '#16a34a', margin: 0, marginTop: 2, fontWeight: 600 }}>Đạt {selectedWeight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} / {MONTHLY_KPI_TARGET.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                                        <ArrowUpRight size={18} color="#16a34a" strokeWidth={3} />
                                        <span style={{ fontSize: 24, fontWeight: 800, color: '#15803d', letterSpacing: '-1px' }}>+{(selectedWeight - MONTHLY_KPI_TARGET).toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(254, 243, 199, 0.4)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(253, 230, 138, 0.5)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                                        <ArrowDownRight size={20} color="#fff" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 800, color: '#92400e', margin: 0 }}>Chưa đạt chỉ tiêu</p>
                                        <p style={{ fontSize: 12, color: '#b45309', margin: 0, marginTop: 2, fontWeight: 600 }}>Đạt {selectedWeight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} / {MONTHLY_KPI_TARGET.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                                        <ArrowDownRight size={18} color="#dc2626" strokeWidth={3} />
                                        <span style={{ fontSize: 24, fontWeight: 800, color: '#dc2626', letterSpacing: '-1px' }}>-{(MONTHLY_KPI_TARGET - selectedWeight).toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Visual Monthly Progress Bars */}
                    <div className="fade-up fade-up-d3" style={{ ...glassStyle, padding: 0 }}>
                        <div style={{ padding: '24px 24px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <BarChart3 size={20} color="#f59e0b" strokeWidth={2.5} />
                                <p style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--c-text)', letterSpacing: '-0.3px' }}>Sản Lượng Theo Tháng</p>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, fontWeight: 600 }}>
                                Mục tiêu huề vốn: <b style={{ color: 'var(--c-text)' }}>{MONTHLY_KPI_TARGET.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn/tháng</b>
                            </p>
                        </div>

                        <div style={{ padding: '0 20px 20px' }}>
                            {yearMonthlyData.map((d, i, arr) => {
                                const pct = (d.weight / maxWeight) * 100;
                                const reached = d.weight >= MONTHLY_KPI_TARGET;
                                const diff = d.weight - MONTHLY_KPI_TARGET;
                                const isSelectedMonth = d.key === `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;

                                return (
                                    <div key={d.key} className="animate-slide-right" style={{
                                        marginBottom: i < arr.length - 1 ? 14 : 0,
                                        padding: isSelectedMonth ? '12px 14px' : '0 4px',
                                        background: isSelectedMonth ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                                        borderRadius: isSelectedMonth ? 16 : 0,
                                        border: isSelectedMonth ? '1px solid rgba(79, 70, 229, 0.15)' : '1px solid transparent',
                                        transition: 'all 0.3s ease',
                                        animationDelay: `${i * 0.04}s`,
                                        opacity: 0,
                                        animationFillMode: 'forwards'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: isSelectedMonth ? 'var(--c-primary)' : 'var(--c-text)', minWidth: 32 }}>{d.month}</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-secondary)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 6 }}>{d.shipCount} tàu</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 14, fontWeight: 800, color: isSelectedMonth ? 'var(--c-primary)' : 'inherit', letterSpacing: '-0.3px' }}>{d.weight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</span>
                                                <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600 }}>tấn</span>
                                                {d.weight > 0 && (
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 800, marginLeft: 2,
                                                        color: reached ? '#16a34a' : '#ef4444',
                                                        background: reached ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
                                                        padding: '2px 6px', borderRadius: 6,
                                                    }}>{reached ? '+' : ''}{diff.toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ height: 26, background: isSelectedMonth ? 'rgba(79, 70, 229, 0.1)' : 'rgba(0,0,0,0.03)', borderRadius: 13, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
                                            <div className="animate-fill" style={{
                                                height: '100%', borderRadius: 13,
                                                width: `${pct}%`,
                                                background: isSelectedMonth
                                                    ? 'linear-gradient(90deg, #4f46e5, #4338ca)'
                                                    : (reached
                                                        ? 'linear-gradient(90deg, #4ade80, #16a34a)'
                                                        : 'linear-gradient(90deg, #fde68a, #f59e0b)'),
                                                transition: 'width 1s cubic-bezier(.16,1,.3,1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10,
                                                boxShadow: isSelectedMonth ? '0 2px 8px rgba(79,70,229,.4)' : (reached ? '0 2px 8px rgba(22,163,74,.3)' : '0 2px 8px rgba(245,158,11,.3)'),
                                            }}>
                                                {d.weight > 0 && (
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: (isSelectedMonth || reached) ? '#fff' : '#92400e', textShadow: (isSelectedMonth || reached) ? '0 1px 2px rgba(0,0,0,.2)' : 'none' }}>
                                                        {Math.round((d.weight / MONTHLY_KPI_TARGET) * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {yearMonthlyData.length === 0 && <EmptyState title="Chưa có dữ liệu" description="Tháng bạn chọn không có chuyến tàu nào." />}
                        </div>

                        {/* Boss KPI Summary details */}
                        <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(248,250,252,0.4)' }}>
                            <div style={{ flex: 1, padding: '16px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                                <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đạt KPI</p>
                                <p style={{ fontSize: 24, fontWeight: 800, margin: 0, marginTop: 4, color: '#16a34a', letterSpacing: '-1px' }}>{yearMonthlyData.filter(d => d.weight >= MONTHLY_KPI_TARGET).length}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-secondary)' }}> / 12</span></p>
                            </div>
                            <div style={{ flex: 1, padding: '16px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                                <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cao nhất</p>
                                <p style={{ fontSize: 20, fontWeight: 800, margin: 0, marginTop: 6, letterSpacing: '-0.5px' }}>{Math.max(...yearMonthlyData.map(d => d.weight), 0).toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</p>
                            </div>
                            <div style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
                                <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TB/tháng</p>
                                <p style={{ fontSize: 20, fontWeight: 800, margin: 0, marginTop: 6, letterSpacing: '-0.5px' }}>{Math.round(yearMonthlyData.reduce((a, d) => a + d.weight, 0) / 12).toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MobileLayout>
    );
}
