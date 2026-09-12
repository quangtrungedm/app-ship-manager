import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { useShips } from '../lib/useShips';
import {
    TrendingUp, Anchor, Calendar, Wallet, CheckCircle2,
    Clock, ArrowRight, ChevronDown, ChevronLeft, ChevronRight,
    Ship as ShipIcon, AlertTriangle
} from 'lucide-react';
import { calcShipSalary, calcBargeBonus, TON_RATE } from '../lib/salary';

const MONTH_NAMES = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];
const GRID_MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

const glassCard = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px -2px rgba(15,23,42,0.04)',
    borderRadius: 20,
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

    // Filter ships for selected month/year
    const selectedShips = useMemo(() => ships.filter(s => {
        const d = new Date(s.arrivalDate);
        return d.getFullYear() === selYear && d.getMonth() === selMonth;
    }), [ships, selYear, selMonth]);

    // Ships completed in this month
    const completedSelectedShips = useMemo(() =>
        selectedShips.filter(s => s.status === 'completed' || !!s.completionDate),
        [selectedShips]
    );

    // Operational statistics
    const selectedWeight = completedSelectedShips.reduce((a, s) => a + (s.weight || 0), 0);
    const totalBarges = completedSelectedShips.filter(s => s.hasBarge).reduce((a, s) => a + (s.bargeCount || 1), 0);

    // Salary breakdown (Piece-rate: 500 VND/ton + 200,000 VND/barge)
    const weightSalary = selectedWeight * TON_RATE;
    const bargeSalary = completedSelectedShips.reduce((a, s) => a + calcBargeBonus(s.hasBarge, s.bargeCount), 0);
    const totalSalary = weightSalary + bargeSalary;

    const paidShips = completedSelectedShips.filter(s => s.isPaid);
    const unpaidShips = completedSelectedShips.filter(s => !s.isPaid);

    const paidSalary = paidShips.reduce((a, s) => a + calcShipSalary(s), 0);
    const unpaidSalary = totalSalary - paidSalary;
    const paidRatio = totalSalary > 0 ? Math.round((paidSalary / totalSalary) * 100) : (completedSelectedShips.length > 0 ? 100 : 0);

    // Global unpaid backlog (completed ships across all months that are unpaid)
    const globalUnpaidShips = useMemo(() => ships.filter(s => s.isPaid === false && (s.status === 'completed' || !!s.completionDate)), [ships]);
    const globalUnpaidCount = globalUnpaidShips.length;
    const globalUnpaidSalary = globalUnpaidShips.reduce((a, s) => a + calcShipSalary(s), 0);

    const isCurrentMonth = now.getFullYear() === selYear && now.getMonth() === selMonth;

    const handlePrevMonth = () => {
        if (selMonth === 0) {
            setSelMonth(11);
            setSelYear(y => y - 1);
            setPickerYear(y => y - 1);
        } else {
            setSelMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (selMonth === 11) {
            setSelMonth(0);
            setSelYear(y => y + 1);
            setPickerYear(y => y + 1);
        } else {
            setSelMonth(m => m + 1);
        }
    };

    const handlePickMonth = (m: number) => {
        setSelMonth(m);
        setSelYear(pickerYear);
        setPickerOpen(false);
    };

    const handleGoToday = () => {
        setSelMonth(now.getMonth());
        setSelYear(now.getFullYear());
        setPickerYear(now.getFullYear());
        setPickerOpen(false);
    };

    return (
        <MobileLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>

                {/* ── 1. BỘ ĐIỀU HƯỚNG THÁNG & NĂM TINH TẾ ── */}
                <div style={glassCard}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px'
                    }}>
                        <button
                            onClick={handlePrevMonth}
                            style={{
                                width: 36, height: 36, borderRadius: 10, border: 'none',
                                background: '#f1f5f9', color: '#475569', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s'
                            }}
                            title="Tháng trước"
                        >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>

                        <button
                            onClick={() => { setPickerOpen(!pickerOpen); setPickerYear(selYear); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                border: 'none', background: 'transparent', cursor: 'pointer',
                                padding: '6px 12px', borderRadius: 10
                            }}
                        >
                            <Calendar size={16} color="#2563eb" strokeWidth={2.5} />
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                                {MONTH_NAMES[selMonth]} {selYear}
                            </span>
                            {isCurrentMonth ? (
                                <span style={{
                                    fontSize: 11, fontWeight: 700, padding: '2px 7px',
                                    borderRadius: 99, background: '#eff6ff', color: '#2563eb',
                                    border: '1px solid #bfdbfe'
                                }}>
                                    Tháng này
                                </span>
                            ) : null}
                            <ChevronDown
                                size={16} color="#64748b" strokeWidth={2.5}
                                style={{
                                    transition: 'transform .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0)'
                                }}
                            />
                        </button>

                        <button
                            onClick={handleNextMonth}
                            style={{
                                width: 36, height: 36, borderRadius: 10, border: 'none',
                                background: '#f1f5f9', color: '#475569', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s'
                            }}
                            title="Tháng sau"
                        >
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Popover chọn tháng */}
                    <div style={{
                        display: 'grid', gridTemplateRows: pickerOpen ? '1fr' : '0fr',
                        transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '0 16px 16px' }}>
                                <div style={{ height: 1, background: '#f1f5f9', marginBottom: 12 }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <button
                                        onClick={() => setPickerYear(y => y - 1)}
                                        style={{ border: 'none', background: '#f8fafc', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
                                    >
                                        <ChevronLeft size={16} color="#475569" />
                                    </button>
                                    <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>Năm {pickerYear}</span>
                                    <button
                                        onClick={() => setPickerYear(y => y + 1)}
                                        style={{ border: 'none', background: '#f8fafc', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
                                    >
                                        <ChevronRight size={16} color="#475569" />
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                                    {GRID_MONTHS.map((label, i) => {
                                        const isActive = selMonth === i && selYear === pickerYear;
                                        const isCurrent = now.getMonth() === i && now.getFullYear() === pickerYear;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handlePickMonth(i)}
                                                style={{
                                                    padding: '10px 0', borderRadius: 10,
                                                    border: isCurrent && !isActive ? '1.5px solid #bfdbfe' : '1.5px solid transparent',
                                                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5,
                                                    fontWeight: isActive ? 800 : 600,
                                                    background: isActive ? '#2563eb' : '#f8fafc',
                                                    color: isActive ? '#ffffff' : '#475569',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {!isCurrentMonth && (
                                    <div style={{ textAlign: 'center', marginTop: 10 }}>
                                        <button
                                            onClick={handleGoToday}
                                            style={{
                                                fontSize: 12, fontWeight: 700, color: '#2563eb',
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Quay về tháng hiện tại
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2. CÁC CHỈ SỐ HOẠT ĐỘNG BỐC DỠ (KPIs) ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Sản lượng hoàn thành */}
                    <div style={{
                        ...glassCard, padding: '16px',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
                        border: '1px solid #bbf7d0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Sản lượng dỡ
                            </span>
                            <div style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <TrendingUp size={18} color="#15803d" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: '#14532d', letterSpacing: '-0.5px', lineHeight: 1 }}>
                                {selectedWeight.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>tấn</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600, display: 'block', marginTop: 6 }}>
                            Định mức 500 đ/tấn
                        </span>
                    </div>

                    {/* Chuyến tàu đã hoàn thành */}
                    <div style={{
                        ...glassCard, padding: '16px',
                        background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
                        border: '1px solid #bfdbfe'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Tàu hoàn thành
                            </span>
                            <div style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <ShipIcon size={18} color="#1d4ed8" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: '#1e3a8a', letterSpacing: '-0.5px', lineHeight: 1 }}>
                                {completedSelectedShips.length}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                                / {selectedShips.length} tàu
                            </span>
                        </div>
                        <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, display: 'block', marginTop: 6 }}>
                            {selectedShips.length - completedSelectedShips.length > 0
                                ? `${selectedShips.length - completedSelectedShips.length} tàu đang bốc dỡ`
                                : 'Đã hoàn tất 100%'}
                        </span>
                    </div>
                </div>

                {/* ── 3. BẢNG KÊ LƯƠNG KHOÁN SẢN LƯỢNG & XÀ LAN (THIẾT KẾ CHUYÊN NGHIỆP) ── */}
                <div style={{
                    ...glassCard, padding: '18px',
                    boxShadow: '0 8px 24px -4px rgba(15,23,42,0.06)'
                }}>
                    {/* Tiêu đề bảng kê */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 12,
                                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(15,23,42,0.15)'
                            }}>
                                <Wallet size={19} color="#38bdf8" strokeWidth={2.5} />
                            </div>
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                                    Lương Khoán Sắt Thép
                                </span>
                                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                    Bảng Kê {MONTH_NAMES[selMonth]} {selYear}
                                </h2>
                            </div>
                        </div>

                        <span style={{
                            fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 8,
                            background: paidRatio === 100 ? '#ecfdf5' : '#fff7ed',
                            color: paidRatio === 100 ? '#047857' : '#c2410c',
                            border: paidRatio === 100 ? '1px solid #a7f3d0' : '1px solid #fed7aa'
                        }}>
                            {paidRatio === 100 ? 'Đã quyết toán 100%' : `Đã nhận ${paidRatio}%`}
                        </span>
                    </div>

                    {/* Khối hiển thị Tổng Lương Khoán */}
                    <div style={{
                        background: '#f8fafc',
                        borderRadius: 16, padding: '14px 16px', marginBottom: 14,
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                            <div>
                                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    Tổng thu nhập công khoán
                                </span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                                    <span style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>
                                        {totalSalary.toLocaleString('vi-VN')}
                                    </span>
                                    <span style={{ fontSize: 15, fontWeight: 800, color: '#64748b' }}>đ</span>
                                </div>
                            </div>
                        </div>

                        {/* Diễn giải chi tiết cơ cấu lương */}
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: '#475569' }}>• Lương sản lượng ({selectedWeight.toLocaleString('vi-VN')} tấn × 500 đ):</span>
                                <span style={{ fontWeight: 800, color: '#0f172a' }}>{weightSalary.toLocaleString('vi-VN')} đ</span>
                            </div>
                            {totalBarges > 0 ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                    <span style={{ color: '#1d4ed8' }}>• Phụ cấp xà lan ({totalBarges} lượt × 200.000 đ):</span>
                                    <span style={{ fontWeight: 800, color: '#1d4ed8' }}>+{bargeSalary.toLocaleString('vi-VN')} đ</span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Thanh tiến độ quyết toán lương */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
                            <span>Tình trạng quyết toán lương</span>
                            <span style={{ color: paidRatio === 100 ? '#059669' : '#2563eb' }}>
                                {paidRatio}% đã thanh toán
                            </span>
                        </div>
                        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                            <div style={{
                                width: `${paidRatio}%`,
                                background: 'linear-gradient(90deg, #10b981, #059669)',
                                transition: 'width 0.4s ease'
                            }} />
                        </div>
                    </div>

                    {/* 2 Thẻ con: Đã thanh toán & Chờ thanh toán */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {/* Đã thanh toán */}
                        <div style={{
                            background: '#f0fdf4',
                            border: '1.5px solid #bbf7d0',
                            borderRadius: 14, padding: '12px 14px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <CheckCircle2 size={15} color="#16a34a" strokeWidth={2.5} />
                                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                                    Đã thanh toán
                                </span>
                            </div>
                            <p style={{ fontSize: 17, fontWeight: 900, color: '#15803d', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                                {paidSalary.toLocaleString('vi-VN')} <span style={{ fontSize: 12, fontWeight: 700 }}>đ</span>
                            </p>
                            <span style={{ fontSize: 11, color: '#166534', fontWeight: 600, display: 'block', marginTop: 4 }}>
                                {paidShips.length} chuyến tàu
                            </span>
                        </div>

                        {/* Chờ thanh toán */}
                        <div
                            onClick={() => unpaidSalary > 0 && navigate('/staff/ships', { state: { defaultTab: 'unpaid' } })}
                            style={{
                                background: unpaidSalary > 0 ? '#fff7ed' : '#f8fafc',
                                border: unpaidSalary > 0 ? '1.5px solid #fed7aa' : '1.5px solid #e2e8f0',
                                borderRadius: 14, padding: '12px 14px',
                                cursor: unpaidSalary > 0 ? 'pointer' : 'default',
                                transition: 'transform 0.15s'
                            }}
                            title={unpaidSalary > 0 ? 'Chạm để xem và chọn thanh toán hàng loạt' : undefined}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Clock size={15} color={unpaidSalary > 0 ? '#ea580c' : '#94a3b8'} strokeWidth={2.5} />
                                    <span style={{
                                        fontSize: 11.5, fontWeight: 800,
                                        color: unpaidSalary > 0 ? '#9a3412' : '#64748b',
                                        textTransform: 'uppercase'
                                    }}>
                                        Chờ thanh toán
                                    </span>
                                </div>
                                {unpaidSalary > 0 && (
                                    <span style={{ fontSize: 10.5, color: '#ea580c', fontWeight: 800 }}>
                                        Thanh toán →
                                    </span>
                                )}
                            </div>
                            <p style={{
                                fontSize: 17, fontWeight: 900,
                                color: unpaidSalary > 0 ? '#c2410c' : '#64748b',
                                margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2
                            }}>
                                {unpaidSalary.toLocaleString('vi-VN')} <span style={{ fontSize: 12, fontWeight: 700 }}>đ</span>
                            </p>
                            <span style={{
                                fontSize: 11,
                                color: unpaidSalary > 0 ? '#9a3412' : '#94a3b8',
                                fontWeight: 600, display: 'block', marginTop: 4
                            }}>
                                {unpaidShips.length} chuyến tàu
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── 4. CÔNG NỢ LƯƠNG CHƯA THANH TOÁN (CẢNH BÁO TOÀN HỆ THỐNG NẾU CÓ) ── */}
                {globalUnpaidCount > 0 && (
                    <div style={{
                        background: '#fff1f2',
                        border: '1.5px solid #fecdd3',
                        borderRadius: 18, padding: '16px',
                        boxShadow: '0 4px 16px -2px rgba(225,29,72,0.08)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, background: '#ffffff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(225,29,72,0.12)'
                                }}>
                                    <AlertTriangle size={18} color="#e11d48" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                                        Công nợ lương chưa quyết toán
                                    </span>
                                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#9f1239', margin: 0 }}>
                                        {globalUnpaidCount} chuyến tàu chưa thanh toán
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: '#ffffff', borderRadius: 14, padding: '12px 14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            border: '1px solid #ffe4e6', marginBottom: 10
                        }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#9f1239' }}>Tổng tiền lương chờ nhận:</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#e11d48', letterSpacing: '-0.5px' }}>
                                {globalUnpaidSalary.toLocaleString('vi-VN')} đ
                            </span>
                        </div>

                        <button
                            onClick={() => navigate('/staff/ships', { state: { defaultTab: 'unpaid' } })}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #e11d48, #be123c)',
                                color: '#ffffff', border: 'none', borderRadius: 12,
                                padding: '10px 14px', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 6,
                                boxShadow: '0 4px 12px rgba(225,29,72,0.25)',
                                transition: 'all 0.15s'
                            }}
                        >
                            Chọn & Thanh toán các tàu chưa nhận lương <ArrowRight size={15} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                {/* ── 5. DANH SÁCH CHUYẾN TÀU HOÀN THÀNH TRONG THÁNG ── */}
                <div style={glassCard}>
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Anchor size={16} color="#0f172a" />
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                                Chuyến Tàu Đã Dỡ ({completedSelectedShips.length})
                            </span>
                        </div>
                        <button
                            onClick={() => navigate('/staff/ships')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                border: 'none', background: 'transparent',
                                color: '#2563eb', fontSize: 12, fontWeight: 700,
                                cursor: 'pointer', padding: '4px 6px'
                            }}
                        >
                            Xem tất cả <ArrowRight size={13} />
                        </button>
                    </div>

                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {completedSelectedShips.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 16px', color: '#94a3b8' }}>
                                <ShipIcon size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: '0 0 2px' }}>
                                    Chưa có chuyến tàu nào hoàn thành
                                </p>
                                <p style={{ fontSize: 12, margin: 0 }}>
                                    trong {MONTH_NAMES[selMonth]} năm {selYear}
                                </p>
                            </div>
                        ) : (
                            completedSelectedShips.slice(0, 5).map(ship => {
                                const shipSalary = calcShipSalary(ship);
                                const arrDate = new Date(ship.arrivalDate).toLocaleDateString('vi-VN', {
                                    day: '2-digit', month: '2-digit'
                                });
                                return (
                                    <div
                                        key={ship.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', borderRadius: 12,
                                            background: '#f8fafc', border: '1px solid #e2e8f0'
                                        }}
                                    >
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <h4 style={{
                                                    fontSize: 13.5, fontWeight: 800, color: '#0f172a',
                                                    margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                }}>
                                                    {ship.name}
                                                </h4>
                                                {ship.hasBarge && (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, padding: '1px 5px',
                                                        borderRadius: 4, background: '#dbeafe', color: '#1e40af'
                                                    }}>
                                                        +{ship.bargeCount || 1} xà lan
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                                                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                                                    Ngày vào: {arrDate}
                                                </span>
                                                <span style={{ fontSize: 11, color: '#0f172a', fontWeight: 700 }}>
                                                    • {ship.weight.toLocaleString('vi-VN')} tấn
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'block' }}>
                                                {shipSalary.toLocaleString('vi-VN')} đ
                                            </span>
                                            <span style={{
                                                display: 'inline-block', marginTop: 2,
                                                fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
                                                background: ship.isPaid ? '#ecfdf5' : '#fff7ed',
                                                color: ship.isPaid ? '#047857' : '#c2410c',
                                                border: ship.isPaid ? '1px solid #a7f3d0' : '1px solid #fed7aa'
                                            }}>
                                                {ship.isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {completedSelectedShips.length > 5 && (
                            <button
                                onClick={() => navigate('/staff/ships')}
                                style={{
                                    width: '100%', padding: '8px', borderRadius: 10,
                                    border: '1px dashed #cbd5e1', background: '#f8fafc',
                                    color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                Xem thêm {completedSelectedShips.length - 5} chuyến tàu khác →
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </MobileLayout>
    );
}

