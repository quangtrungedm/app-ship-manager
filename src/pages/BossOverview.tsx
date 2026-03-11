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
        selectedShips.filter(s => s.status === 'completed' || s.completionDate)
        , [selectedShips]);

    const selectedWeight = completedSelectedShips.reduce((a, s) => a + s.weight, 0);
    const selectedPaidWeight = completedSelectedShips.filter(s => s.isPaid).reduce((a, s) => a + s.weight, 0);

    // Sat Thep calculations (500 VND/ton)
    const isSatThep = division === 'SAT_THEP';
    const totalSalary = selectedWeight * 500;
    const paidSalary = selectedPaidWeight * 500;
    const unpaidSalary = totalSalary - paidSalary;

    const globalUnpaidShips = useMemo(() => ships.filter(s => s.division === 'SAT_THEP' && s.isPaid === false && (s.status === 'completed' || s.completionDate)), [ships]);
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
                // Only count shipped data if completed
                if (s.status === 'completed' || s.completionDate) {
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
            <div className="card fade-up" style={{ marginBottom: 16, overflow: 'hidden' }}>
                <button
                    onClick={() => { setPickerOpen(!pickerOpen); setPickerYear(selYear); }}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', padding: '12px 16px', border: 'none', background: 'transparent',
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    <Calendar size={16} color="var(--c-primary)" />
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{MONTH_NAMES[selMonth]} {selYear}</span>
                    <ChevronDown size={16} color="var(--c-text-secondary)" style={{ transition: 'transform .2s', transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                {pickerOpen && (
                    <div style={{ padding: '0 16px 16px' }}>
                        <div style={{ height: 1, background: 'var(--c-border)', marginBottom: 12 }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <button onClick={() => setPickerYear(y => y - 1)} style={{ border: 'none', background: 'var(--c-bg)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit', transition: 'all 0.1s', WebkitTapHighlightColor: 'transparent' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ fontSize: 15, fontWeight: 800 }}>{pickerYear}</span>
                            <button onClick={() => setPickerYear(y => y + 1)} style={{ border: 'none', background: 'var(--c-bg)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit', transition: 'all 0.1s', WebkitTapHighlightColor: 'transparent' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                            {GRID_MONTHS.map((label, i) => {
                                const isActive = selMonth === i && selYear === pickerYear;
                                const isCurrent = now.getMonth() === i && now.getFullYear() === pickerYear;
                                return (
                                    <button key={i} onClick={() => handlePickMonth(i)} style={{
                                        padding: '10px 0', borderRadius: 10, border: isCurrent && !isActive ? '2px solid var(--c-primary)' : '2px solid transparent',
                                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 700 : 500,
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
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div key={`cards-${selMonth}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div className="fade-up fade-up-d1" style={{
                    padding: 18, borderRadius: 'var(--radius)', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    boxShadow: '0 8px 20px -4px rgba(79,70,229,.4)',
                }}>
                    <div style={{ position: 'absolute', top: -12, right: -12, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                    <div style={{ position: 'absolute', bottom: -8, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, backdropFilter: 'blur(8px)' }}>
                        <Anchor size={20} color="#fff" strokeWidth={2.5} />
                    </div>
                    <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.8)', fontWeight: 600, marginBottom: 4 }}>Tàu hoàn thành</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>{MONTH_NAMES[selMonth]} · {selYear}</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginTop: 8, letterSpacing: '-1px' }}>{completedSelectedShips.length}</p>
                </div>
                <div className="fade-up fade-up-d2" style={{
                    padding: 18, borderRadius: 'var(--radius)', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    boxShadow: '0 8px 20px -4px rgba(5,150,105,.4)',
                }}>
                    <div style={{ position: 'absolute', top: -12, right: -12, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                    <div style={{ position: 'absolute', bottom: -8, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, backdropFilter: 'blur(8px)' }}>
                        <TrendingUp size={20} color="#fff" strokeWidth={2.5} />
                    </div>
                    <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.8)', fontWeight: 600, marginBottom: 4 }}>Sản lượng</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>{MONTH_NAMES[selMonth]} · {selYear}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                        <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-1px' }}>{selectedWeight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</p>
                    </div>
                </div>
            </div>

            {/* ── Conditional Dashboard Content ── */}
            {isSatThep ? (
                <>
                    {/* GLOBAL UNPAID WARNING WIDGET */}
                    {globalUnpaidCount > 0 && (
                        <div className="card fade-up fade-up-d1" style={{
                            marginBottom: 20,
                            background: 'linear-gradient(145deg, #fef2f2 0%, #fff1f2 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            boxShadow: 'var(--shadow-glow-danger)',
                            padding: '16px 18px',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)' }}>
                                    <Wallet size={20} color="#dc2626" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', margin: 0 }}>Cảnh báo Lương Tồn Đọng</p>
                                    <p style={{ fontSize: 12, color: '#b91c1c', margin: '4px 0 0 0', fontWeight: 600, opacity: 0.8 }}>Tất cả các tháng</p>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.5)' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: '#7f1d1d', margin: '0 0 6px 0', fontWeight: 700 }}>Tồn đọng {globalUnpaidCount} chuyến</p>
                                    <p style={{ fontSize: 22, color: '#dc2626', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>{globalUnpaidSalary.toLocaleString('vi-VN')} đ</p>
                                </div>
                                <button
                                    onClick={() => navigate('/boss/ships')}
                                    style={{
                                        background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-round)',
                                        padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                                        transition: 'transform 0.2s',
                                        WebkitTapHighlightColor: 'transparent'
                                    }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    Theo dõi <ArrowRight size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- IRON & STEEL: Cashflow Analytics --- */}
                    <div key={`salary-${selMonth}`} className="card fade-up fade-up-d2" style={{ padding: 0, marginBottom: 20, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 18px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '1px solid var(--c-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                <div style={{ padding: 6, background: 'var(--c-primary-light)', borderRadius: 8 }}>
                                    <Wallet size={18} color="var(--c-primary)" strokeWidth={2.5} />
                                </div>
                                <p style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--c-text)' }}>Tổng Lương {MONTH_NAMES[selMonth]}</p>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 8, fontWeight: 500 }}>Dự chi nhân công (500đ/tấn):</p>
                            <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--c-primary)', margin: 0, letterSpacing: '-1px' }}>
                                {totalSalary.toLocaleString('vi-VN')} <span style={{ fontSize: 16, color: 'var(--c-text-secondary)', fontWeight: 600 }}>VNĐ</span>
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            <div style={{ padding: 18, borderRight: '1px solid var(--c-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <CheckCircle size={16} color="#16a34a" strokeWidth={2.5} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-secondary)' }}>Đã giải ngân</span>
                                </div>
                                <p style={{ fontSize: 20, fontWeight: 800, color: '#15803d', margin: 0, letterSpacing: '-0.5px' }}>
                                    {paidSalary.toLocaleString('vi-VN')} <span style={{ fontSize: 13, fontWeight: 600 }}>đ</span>
                                </p>
                            </div>
                            <div style={{ padding: 18, background: 'var(--c-danger-light)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Clock size={16} color="#dc2626" strokeWidth={2.5} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Còn nợ</span>
                                </div>
                                <p style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', margin: 0, letterSpacing: '-0.5px' }}>
                                    {unpaidSalary.toLocaleString('vi-VN')} <span style={{ fontSize: 13, fontWeight: 600 }}>đ</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // --- VIN CAN GIO: KPI Analytics ---
                <>
                    {/* KPI Progress */}
                    <div key={`kpi-${selMonth}`} className="card fade-up fade-up-d2" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Target size={16} color="var(--c-primary)" />
                                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>KPI {MONTH_NAMES[selMonth]} {selYear}</p>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: kpiReached ? 'var(--c-success)' : 'var(--c-warning)' }}>{kpiPercent}%</span>
                        </div>
                        <div style={{ padding: '0 16px' }}>
                            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                                <div className="animate-fill" style={{ height: '100%', borderRadius: 99, width: `${kpiPercent}%`, background: kpiReached ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#f59e0b,#ea580c)', transition: 'width .3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--c-text-secondary)', marginTop: 4, paddingBottom: 12 }}>
                                <span>0</span>
                                <span>Mục tiêu: {MONTHLY_KPI_TARGET.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn</span>
                            </div>
                        </div>
                        {kpiReached ? (
                            <div style={{ background: 'linear-gradient(135deg, #dcfce7, #f0fdf4)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #bbf7d0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Trophy size={18} color="#fff" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: 0 }}>Vượt chỉ tiêu!</p>
                                        <p style={{ fontSize: 11, color: '#16a34a', margin: 0, marginTop: 2 }}>Đạt {selectedWeight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} / {MONTHLY_KPI_TARGET.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                                        <ArrowUpRight size={16} color="#16a34a" />
                                        <span style={{ fontSize: 18, fontWeight: 800, color: '#15803d' }}>+{(selectedWeight - MONTHLY_KPI_TARGET).toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</span>
                                    </div>
                                    <p style={{ fontSize: 11, color: '#16a34a', margin: 0 }}>tấn vượt</p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fffbeb)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #fde68a' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ArrowDownRight size={18} color="#fff" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0 }}>Chưa đạt chỉ tiêu</p>
                                        <p style={{ fontSize: 11, color: '#a16207', margin: 0, marginTop: 2 }}>Đạt {selectedWeight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} / {MONTHLY_KPI_TARGET.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                                        <ArrowDownRight size={16} color="#dc2626" />
                                        <span style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>-{(MONTHLY_KPI_TARGET - selectedWeight).toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</span>
                                    </div>
                                    <p style={{ fontSize: 11, color: '#a16207', margin: 0 }}>tấn thiếu</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Visual Monthly Progress Bars */}
                    <div className="card fade-up fade-up-d3" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 16px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <BarChart3 size={16} color="#f59e0b" />
                                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Sản Lượng Theo Tháng</p>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', margin: 0 }}>
                                Mục tiêu huề vốn: <b style={{ color: 'var(--c-text)' }}>{MONTHLY_KPI_TARGET.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} tấn/tháng</b>
                            </p>
                        </div>

                        <div style={{ padding: '0 16px 16px' }}>
                            {yearMonthlyData.map((d, i, arr) => {
                                const pct = (d.weight / maxWeight) * 100;
                                const reached = d.weight >= MONTHLY_KPI_TARGET;
                                const diff = d.weight - MONTHLY_KPI_TARGET;
                                const isSelectedMonth = d.key === `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;

                                return (
                                    <div key={d.key} className="animate-slide-right" style={{
                                        marginBottom: i < arr.length - 1 ? 12 : 0,
                                        padding: isSelectedMonth ? '8px 12px' : '0',
                                        background: isSelectedMonth ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                                        borderRadius: isSelectedMonth ? 12 : 0,
                                        border: isSelectedMonth ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid transparent',
                                        transition: 'all 0.3s ease',
                                        animationDelay: `${i * 0.06}s`,
                                        opacity: 0,
                                        animationFillMode: 'forwards'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: isSelectedMonth ? 'var(--c-primary)' : 'var(--c-text)', minWidth: 28 }}>{d.month}</span>
                                                <span style={{ fontSize: 10, color: 'var(--c-text-secondary)', background: 'var(--c-bg)', padding: '1px 6px', borderRadius: 4 }}>{d.shipCount} tàu</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: isSelectedMonth ? 'var(--c-primary)' : 'inherit' }}>{d.weight.toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</span>
                                                <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>tấn</span>
                                                {d.weight > 0 && (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, marginLeft: 2,
                                                        color: reached ? '#16a34a' : '#ef4444',
                                                        background: reached ? '#dcfce7' : '#fef2f2',
                                                        padding: '1px 6px', borderRadius: 4,
                                                    }}>{reached ? '+' : ''}{diff.toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ height: 22, background: isSelectedMonth ? 'rgba(79, 70, 229, 0.1)' : '#f1f5f9', borderRadius: 11, overflow: 'hidden' }}>
                                            <div className="animate-fill" style={{
                                                height: '100%', borderRadius: 11,
                                                width: `${pct}%`,
                                                background: isSelectedMonth
                                                    ? 'linear-gradient(90deg, #4f46e5, #4338ca)'
                                                    : (reached
                                                        ? 'linear-gradient(90deg, #4ade80, #16a34a)'
                                                        : 'linear-gradient(90deg, #fde68a, #f59e0b)'),
                                                transition: 'width 1s cubic-bezier(.16,1,.3,1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                                                boxShadow: isSelectedMonth ? '0 2px 8px rgba(79,70,229,.4)' : (reached ? '0 2px 8px rgba(22,163,74,.3)' : '0 2px 8px rgba(245,158,11,.3)'),
                                            }}>
                                                {d.weight > 0 && (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: (isSelectedMonth || reached) ? '#fff' : '#92400e', textShadow: (isSelectedMonth || reached) ? '0 1px 2px rgba(0,0,0,.2)' : 'none' }}>
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
                        <div style={{ display: 'flex', borderTop: '1px solid var(--c-border)' }}>
                            <div style={{ flex: 1, padding: '12px 16px', textAlign: 'center', borderRight: '1px solid var(--c-border)' }}>
                                <p style={{ fontSize: 10, color: 'var(--c-text-secondary)', margin: 0, fontWeight: 500 }}>Đạt KPI</p>
                                <p style={{ fontSize: 16, fontWeight: 800, margin: 0, marginTop: 2, color: '#16a34a' }}>{yearMonthlyData.filter(d => d.weight >= MONTHLY_KPI_TARGET).length}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text-secondary)' }}> / 12</span></p>
                            </div>
                            <div style={{ flex: 1, padding: '12px 16px', textAlign: 'center', borderRight: '1px solid var(--c-border)' }}>
                                <p style={{ fontSize: 10, color: 'var(--c-text-secondary)', margin: 0, fontWeight: 500 }}>Cao nhất</p>
                                <p style={{ fontSize: 16, fontWeight: 800, margin: 0, marginTop: 2 }}>{Math.max(...yearMonthlyData.map(d => d.weight), 0).toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</p>
                            </div>
                            <div style={{ flex: 1, padding: '12px 16px', textAlign: 'center' }}>
                                <p style={{ fontSize: 10, color: 'var(--c-text-secondary)', margin: 0, fontWeight: 500 }}>TB/tháng</p>
                                <p style={{ fontSize: 16, fontWeight: 800, margin: 0, marginTop: 2 }}>{Math.round(yearMonthlyData.reduce((a, d) => a + d.weight, 0) / 12).toLocaleString('vi-VN', { maximumFractionDigits: 5 })}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </MobileLayout>
    );
}
