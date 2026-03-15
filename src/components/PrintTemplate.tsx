import { forwardRef } from 'react';

interface PrintTemplateProps {
    type: 'khoi_luong' | 'ty_trong';
    data: {
        date: Date;
        vinconsRep: string;
        securityRep: string;
        materialName: string;
        startDate: Date | null;
        endDate: Date | null;
        quantity: string;
        totalWeight: string;
        shipName: string;
        hocData: Array<{
            khongHang: string;
            coHang: string;
            hang: string;
            quyDoi: string;
        }>;
        totalQuyDoi: string;
        words: string;
    };
}

export const PrintTemplate = forwardRef<HTMLDivElement, PrintTemplateProps>(({ type, data }, ref) => {
    const isKhoiLuong = type === 'khoi_luong';

    // Format helpers
    const d = data.date;
    const dateStr = `Hôm nay, ngày ${d.getDate().toString().padStart(2, '0')} Tháng ${(d.getMonth() + 1).toString().padStart(2, '0')} Năm ${d.getFullYear()}`;

    const formatTime = (date: Date | null) => {
        if (!date) return '...... Ngày ...... Tháng ......';
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} Ngày ${date.getDate().toString().padStart(2, '0')} Tháng ${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    return (
        <div ref={ref} className="print-document" style={{
            fontFamily: '"Times New Roman", Times, serif',
            color: '#000',
            background: '#fff',
            padding: '20mm',
            width: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
            fontSize: '13pt',
            lineHeight: 1.5,
            margin: '0 auto',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '14pt', margin: 0, fontWeight: 'bold' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
                <h3 style={{ fontSize: '13pt', margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>Độc Lập - Tự Do - Hạnh Phúc</h3>
                <div style={{ borderBottom: '1.5px solid #000', width: '60%', margin: '14px auto', height: 1 }}></div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '20px 0' }}>
                    {isKhoiLuong ? 'BIÊN BẢN XÁC NHẬN KHỐI LƯỢNG' : 'BIÊN BẢN XÁC NHẬN KHỐI LƯỢNG TỶ TRỌNG'}
                </h1>
            </div>

            {/* Date */}
            <div style={{ marginBottom: 16 }}>
                <i>{dateStr}</i>
            </div>

            {/* Section I */}
            <div>
                <p style={{ fontWeight: 'bold', marginBottom: 12 }}>I. Thành phần</p>

                <p style={{ fontWeight: 'bold', marginBottom: 8 }}>1. Đơn vị cung cấp: Công ty TNHH Phát Triển Đầu Tư Thiên Phúc</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span>Đại diện: Trần Quang Trung</span>
                    <span style={{ width: 250 }}>Chức vụ: NCC</span>
                </div>

                <p style={{ fontWeight: 'bold', marginBottom: 8 }}>2. Chủ đầu tư: Công ty Cổ phần đầu tư và xây dựng VINCONS</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Đại diện: {data.vinconsRep || '........................................................'}</span>
                    <span style={{ width: 250 }}>Chức vụ: CB. Kho VINCONS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span>Đại diện: ........................................................</span>
                    <span style={{ width: 250 }}>Chức vụ: CB.</span>
                </div>

                <p style={{ fontWeight: 'bold', marginBottom: 8 }}>3. Đại diện bộ phận An Ninh - Dự Án Vinhomes Cần Giờ</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Đại diện: {data.securityRep || '........................................................'}</span>
                    <span style={{ width: 250 }}>Chức vụ: An Ninh</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span>Đại diện: ........................................................</span>
                    <span style={{ width: 250 }}>Chức vụ: An Ninh</span>
                </div>
            </div>

            {/* Section II */}
            <div>
                <p style={{ marginBottom: 12 }}>II. Nội dung biên bản</p>
                <p style={{ marginBottom: 8 }}>Tên vật tư : {data.materialName || '...........................................'}</p>

                <p style={{ marginBottom: 8 }}>
                    Thời gian: Từ {formatTime(data.startDate)} - Đến {formatTime(data.endDate)} Năm {data.endDate?.getFullYear() || 2026}
                </p>

                {isKhoiLuong ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>1. Số lượng chuyến xe ben vận chuyển:</span>
                        <span style={{ paddingRight: 100 }}>{data.quantity || '...........'} chuyến</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>1. Số lượng hộc</span>
                        <span style={{ paddingRight: 150 }}>{data.quantity || '...........'} Hộc</span>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ paddingLeft: isKhoiLuong ? 30 : 0 }}>{isKhoiLuong ? 'Tổng khối lượng' : '2. Tổng khối lượng'}</span>
                    <span style={{ paddingRight: 100 }}>{data.totalWeight || '........................'} KG</span>
                </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, textAlign: 'center' }}>
                <thead>
                    <tr>
                        <th style={{ border: '1px solid #000', padding: 8, width: '5%' }}>STT</th>
                        <th style={{ border: '1px solid #000', padding: 8, width: '18%' }}>SỐ HIỆU TÀU</th>
                        <th style={{ border: '1px solid #000', padding: 8, width: '12%' }}>TỶ TRỌNG</th>
                        <th style={{ border: '1px solid #000', padding: 8, width: '16%' }}>TRỌNG LƯỢNG HỘC KHÔNG HÀNG</th>
                        <th style={{ border: '1px solid #000', padding: 8, width: '16%' }}>TRỌNG LƯỢNG HỘC CÓ HÀNG</th>
                        <th style={{ border: '1px solid #000', padding: 8, width: '16%' }}>TRỌNG LƯỢNG HÀNG</th>
                        <th style={{ border: '1px solid #000', padding: 8, width: '17%' }}>Quy Đổi /M3</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4, 5].map((num, i) => (
                        <tr key={num}>
                            <td style={{ border: '1px solid #000', padding: 6 }}>{num}</td>
                            {i === 0 && (
                                <td rowSpan={5} style={{ border: '1px solid #000', padding: 6, verticalAlign: 'middle', fontWeight: 'bold' }}>
                                    {data.shipName}
                                </td>
                            )}
                            <td style={{ border: '1px solid #000', padding: 6 }}>Hộc {num}</td>
                            <td style={{ border: '1px solid #000', padding: 6 }}>{data.hocData[i]?.khongHang || ''}</td>
                            <td style={{ border: '1px solid #000', padding: 6 }}>{data.hocData[i]?.coHang || ''}</td>
                            <td style={{ border: '1px solid #000', padding: 6 }}>{data.hocData[i]?.hang || ''}</td>
                            {i === 0 && (
                                <td rowSpan={6} style={{ border: '1px solid #000', padding: 6, verticalAlign: 'middle' }}>
                                    {data.totalQuyDoi}
                                </td>
                            )}
                        </tr>
                    ))}
                    <tr>
                        <td style={{ border: '1px solid #000', padding: 6 }}>6</td>
                        <td colSpan={2} style={{ border: '1px solid #000', padding: 6, fontWeight: 'bold' }}>Tổng chia trung bình 5 hộc</td>
                        <td style={{ border: '1px solid #000', padding: 6, fontWeight: 'bold' }}>
                            {/* Compute avg if possible */}
                            {(() => {
                                const valid = data.hocData.map(h => parseFloat(h.khongHang)).filter(n => !isNaN(n));
                                if (valid.length > 0) {
                                    return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
                                }
                                return '';
                            })()}
                        </td>
                        <td style={{ border: '1px solid #000', padding: 6 }}></td>
                        <td style={{ border: '1px solid #000', padding: 6 }}></td>
                    </tr>
                </tbody>
            </table>

            {/* Footer */}
            <div style={{ marginBottom: 12 }}>
                Tổng khối lượng Quy đổi Ra M3: {data.totalQuyDoi ? <span style={{ fontWeight: 'bold' }}>{data.totalQuyDoi}</span> : '.......................................................................'}
            </div>

            <div style={{ marginBottom: 40 }}>
                Bằng chữ: <i>{data.words || '..................................................................................................'}</i>
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontWeight: 'bold', fontSize: '11pt' }}>
                <div style={{ flex: 1 }}>ĐẠI DIỆN NCC</div>
                <div style={{ flex: 1 }}>ĐẠI DIỆN BỐC XÚC</div>
                <div style={{ flex: 1 }}>Đại Diện An Ninh</div>
                <div style={{ flex: 1 }}>BP KHO</div>
            </div>
        </div>
    );
});
