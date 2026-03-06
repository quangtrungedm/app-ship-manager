import { Ship } from '../types';

export const MOCK_SHIPS: Ship[] = [
    // ── Tháng 10/2025 ── Tổng: 31,700 tấn (Đạt KPI)
    {
        id: 'shp-009',
        name: 'Vinashin Sun',
        arrivalDate: '2025-10-08T06:00:00Z',
        completionDate: '2025-10-11T10:00:00Z',
        weight: 13500,
        documents: [],
    },
    {
        id: 'shp-010',
        name: 'Trường Hải 05',
        arrivalDate: '2025-10-22T08:00:00Z',
        completionDate: '2025-10-25T14:00:00Z',
        weight: 18200,
        documents: [{ id: 'doc-11', name: 'Van_don_TH05.pdf', url: '#' }],
    },

    // ── Tháng 11/2025 ── Tổng: 38,500 tấn (Đạt KPI)
    {
        id: 'shp-011',
        name: 'Hải Phòng Star',
        arrivalDate: '2025-11-05T07:00:00Z',
        completionDate: '2025-11-08T12:00:00Z',
        weight: 22000,
        documents: [{ id: 'doc-12', name: 'Bill_of_Lading_HPS.pdf', url: '#' }],
    },
    {
        id: 'shp-012',
        name: 'Vosco Pioneer',
        arrivalDate: '2025-11-20T09:00:00Z',
        completionDate: '2025-11-23T16:00:00Z',
        weight: 16500,
        documents: [],
    },

    // ── Tháng 12/2025 ── Tổng: 39,000 tấn (Đạt KPI)
    {
        id: 'shp-013',
        name: 'Biển Đông 18',
        arrivalDate: '2025-12-03T06:00:00Z',
        completionDate: '2025-12-06T11:00:00Z',
        weight: 28000,
        documents: [{ id: 'doc-13', name: 'Thong_quan_BD18.pdf', url: '#' }],
    },
    {
        id: 'shp-014',
        name: 'Phú Quốc Express',
        arrivalDate: '2025-12-18T08:00:00Z',
        completionDate: '2025-12-21T15:00:00Z',
        weight: 11000,
        documents: [],
    },

    // ── Tháng 1/2026 ── Tổng: 35,500 tấn (Đạt KPI)
    {
        id: 'shp-001',
        name: 'Sài Gòn Queen',
        arrivalDate: '2026-01-10T08:00:00Z',
        completionDate: '2026-01-13T14:30:00Z',
        weight: 12000,
        documents: [
            { id: 'doc-1', name: 'Van_don_SGQ.pdf', url: '#' },
            { id: 'doc-2', name: 'Giay_thong_quan.pdf', url: '#' },
            { id: 'doc-5', name: 'Bao_cao_an_toan.pdf', url: '#' },
        ],
        bossNotes: 'Xử lý nhanh gọn, xuất sắc.'
    },
    {
        id: 'shp-007',
        name: 'Đà Nẵng Glory',
        arrivalDate: '2026-01-22T06:00:00Z',
        completionDate: '2026-01-25T12:00:00Z',
        weight: 9500,
        documents: [{ id: 'doc-10', name: 'Manifest_DNG.pdf', url: '#' }],
    },
    {
        id: 'shp-015',
        name: 'Mekong River',
        arrivalDate: '2026-01-28T07:00:00Z',
        completionDate: '2026-01-30T14:00:00Z',
        weight: 14000,
        documents: [{ id: 'doc-14', name: 'Van_don_MKR.pdf', url: '#' }],
    },

    // ── Tháng 2/2026 ── Tổng: 25,500 tấn (Chưa đạt KPI)
    {
        id: 'shp-005',
        name: 'Cần Giờ 01',
        arrivalDate: '2026-02-05T06:00:00Z',
        completionDate: '2026-02-08T10:00:00Z',
        weight: 15000,
        documents: [{ id: 'doc-9', name: 'Van_don_CG01.pdf', url: '#' }],
    },
    {
        id: 'shp-016',
        name: 'Côn Đảo Star',
        arrivalDate: '2026-02-12T08:00:00Z',
        completionDate: '2026-02-14T15:00:00Z',
        weight: 10500,
        documents: [],
    },

    // ── Tháng 3/2026 ── Tổng: 33,500 tấn (Đạt KPI)
    {
        id: 'shp-002',
        name: 'Hồ Chí Minh 36',
        arrivalDate: '2026-03-01T07:00:00Z',
        completionDate: '2026-03-03T15:00:00Z',
        weight: 14000,
        documents: [{ id: 'doc-3', name: 'Manifest_HCM36.pdf', url: '#' }],
        bossNotes: 'Ưu tiên bốc dỡ khoang A trước.'
    },
    {
        id: 'shp-003',
        name: 'Nha Trang Bay',
        arrivalDate: '2026-03-02T10:00:00Z',
        completionDate: '2026-03-04T08:00:00Z',
        weight: 11000,
        documents: []
    },
    {
        id: 'shp-004',
        name: 'Cát Lái Star',
        arrivalDate: '2026-03-04T08:00:00Z',
        completionDate: '2026-03-04T18:00:00Z',
        weight: 8500,
        documents: [
            { id: 'doc-4', name: 'Giay_bao_tau_den.pdf', url: '#' },
            { id: 'doc-6', name: 'Manifest_hang_hoa.pdf', url: '#' },
            { id: 'doc-7', name: 'Giay_phep_cang.pdf', url: '#' },
            { id: 'doc-8', name: 'Chung_nhan_bao_hiem.pdf', url: '#' },
        ]
    },

    // ── Mảng Sắt Thép (SAT_THEP) ──
    {
        id: 'shp-sat-01',
        name: 'Thép Hoà Phát 01',
        arrivalDate: '2026-03-01T06:00:00Z',
        completionDate: '2026-03-03T10:00:00Z',
        status: 'completed',
        weight: 12500,
        isPaid: true,
        division: 'SAT_THEP',
        documents: [],
    },
    {
        id: 'shp-sat-02',
        name: 'Vina Kyoei Star',
        arrivalDate: '2026-03-04T08:00:00Z',
        status: 'entering',
        weight: 9800.5,
        isPaid: false,
        division: 'SAT_THEP',
        documents: [],
    },
    {
        id: 'shp-sat-03',
        name: 'Pomina Express',
        arrivalDate: '2026-02-15T09:00:00Z',
        completionDate: '2026-02-18T16:00:00Z',
        status: 'completed',
        weight: 15200,
        isPaid: false,
        division: 'SAT_THEP',
        documents: [],
    }
];

// KPI Target: monthly tonnage needed to break even
export const MONTHLY_KPI_TARGET = 30000; // tấn/tháng
