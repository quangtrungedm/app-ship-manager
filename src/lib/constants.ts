export const STANDARD_PORTS = [
    'Sowatco Long Bình',
    'Long Bình Tân',
    'Gò Dầu',
    'Vĩnh Tân',
    'Cẩm Nguyên',
    'Bourbon',
    'Cảng Khác',
] as const;

export type PortName = (typeof STANDARD_PORTS)[number] | string;
