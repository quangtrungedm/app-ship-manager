import { useState, useEffect, useCallback } from 'react';
import { Ship } from '../types';
import { isConfigured } from './config';
import * as api from './api';
import { MOCK_SHIPS } from '../data/mockShips';
import { useAuth } from './AuthContext';

interface UseShipsReturn {
    ships: Ship[];
    loading: boolean;
    error: string | null;
    addShip: (ship: Omit<Ship, 'id'>) => Promise<void>;
    updateShip: (ship: Ship) => Promise<void>;
    deleteShip: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useShips(): UseShipsReturn {
    const { division } = useAuth();

    const [ships, setShips] = useState<Ship[]>(() => {
        // Init from cache if available
        const cached = localStorage.getItem(`ship_manager_cache_${division}`);
        if (cached) {
            try { return JSON.parse(cached); } catch (e) { return []; }
        }
        return [];
    });
    // If we have cached ships, don't show full loading state initially
    const [loading, setLoading] = useState(!localStorage.getItem(`ship_manager_cache_${division}`));
    const [error, setError] = useState<string | null>(null);

    const loadShips = useCallback(async () => {
        // Ensure ships belong to the right division. Legacy ships without a division default to 'VIN_CAN_GIO'
        const filterByDiv = (s: Ship) => s.division === division || (division === 'VIN_CAN_GIO' && !s.division);

        if (!isConfigured()) {
            setShips(MOCK_SHIPS.filter(filterByDiv));
            setLoading(false);
            return;
        }

        setError(null);
        try {
            // Background fetch
            const data = await api.fetchShips();
            const myShips = data.filter(filterByDiv);
            setShips(myShips);
            localStorage.setItem(`ship_manager_cache_${division}`, JSON.stringify(myShips));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
            // Keep existing ships/cache on error, don't fallback to mock
            if (ships.length === 0) setShips(MOCK_SHIPS.filter(filterByDiv));
        } finally {
            setLoading(false);
        }
    }, [ships.length, division]);

    useEffect(() => { loadShips(); }, [loadShips]);

    // Listen to global Pull-to-Refresh event
    useEffect(() => {
        const handleRefresh = () => { loadShips(); };
        window.addEventListener('app:refresh', handleRefresh);
        return () => window.removeEventListener('app:refresh', handleRefresh);
    }, [loadShips]);

    const handleAdd = async (ship: Omit<Ship, 'id'>) => {
        const shipPayload = { ...ship, division: division || undefined };

        // Cập nhật UI ngay lập tức
        const tempId = (ship as any).id || `shp-${Date.now()}`;
        const newShip = { ...shipPayload, id: tempId } as Ship;
        setShips(prev => [newShip, ...prev]);

        if (isConfigured() && !(ship as any)._isBackgroundRealUpdate) {
            try {
                const { id } = await api.addShip(shipPayload);
                // Lặng lẽ thay thế ID thật mà không chớp nhoáng UI
                setShips(prev => prev.map(s => s.id === tempId ? { ...s, id } : s));
            } catch (err) {
                // Rollback nếu API lỗi
                setShips(prev => prev.filter(s => s.id !== tempId));
                console.error("Lỗi khi thêm tàu:", err);
                throw err;
            }
        }
    };

    const handleUpdate = async (ship: Ship) => {
        // Cập nhật UI ngay lập tức
        setShips(prev => prev.map(s => s.id === ship.id ? ship : s));

        if (isConfigured()) {
            try {
                await api.updateShip(ship);
            } catch (err) {
                console.error("Lỗi khi cập nhật tàu:", err);
                // Có thể trigger fetch lại nếu thực sự khắt khe về data sync
            }
        }
    };

    const handleDelete = async (id: string) => {
        // Cập nhật UI ngay lập tức
        setShips(prev => prev.filter(s => s.id !== id));

        if (isConfigured()) {
            try {
                await api.deleteShip(id);
            } catch (err) {
                console.error("Lỗi khi xóa tàu:", err);
            }
        }
    };

    return {
        ships,
        loading,
        error,
        addShip: handleAdd,
        updateShip: handleUpdate,
        deleteShip: handleDelete,
        refresh: loadShips,
    };
}
