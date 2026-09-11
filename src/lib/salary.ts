// ── Quy tắc tính lương tàu ──
// Lương sản lượng: 500đ / tấn
// Phụ cấp xà lan (salan): 200.000đ / 1 xà lan

export const TON_RATE = 500;
export const BARGE_BONUS_PER_UNIT = 200000;

export interface ShipSalaryInfo {
    weight: number;
    hasBarge?: boolean;
    bargeCount?: number;
}

/**
 * Tính tiền phụ cấp xà lan (nếu có chọn xà lan)
 * Mặc định nếu hasBarge = true thì số lượng tối thiểu là 1 xà lan (+200.000đ)
 */
export function calcBargeBonus(hasBarge?: boolean, bargeCount?: number): number {
    if (!hasBarge) return 0;
    const count = typeof bargeCount === 'number' && bargeCount > 0 ? bargeCount : 1;
    return count * BARGE_BONUS_PER_UNIT;
}

/**
 * Tính tổng lương chuyến tàu = (Sản lượng * 500đ) + (Số xà lan * 200.000đ)
 */
export function calcShipSalary(ship: ShipSalaryInfo): number {
    const weightSalary = (ship.weight || 0) * TON_RATE;
    const bargeBonus = calcBargeBonus(ship.hasBarge, ship.bargeCount);
    return Math.round(weightSalary + bargeBonus);
}
