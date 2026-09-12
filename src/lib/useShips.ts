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
    batchUpdateShips: (ships: Ship[]) => Promise<void>;
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
        // Ensure ships belong to the right division
        const filterByDiv = (s: Ship) => s.division === division || !s.division;

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

    const cacheKey = `ship_manager_cache_${division || 'SAT_THEP'}`;

    const handleAdd = async (ship: Omit<Ship, 'id'>) => {
        const shipPayload = { ...ship, division: division || 'SAT_THEP' };
        const tempId = (ship as any).id || `shp-${Date.now()}`;
        const newShip = { ...shipPayload, id: tempId } as Ship;

        // Cập nhật UI và localStorage ngay lập tức
        setShips(prev => {
            const next = [newShip, ...prev];
            localStorage.setItem(cacheKey, JSON.stringify(next));
            return next;
        });

        if (isConfigured() && !(ship as any)._isBackgroundRealUpdate) {
            try {
                const { id } = await api.addShip(shipPayload);
                setShips(prev => {
                    const next = prev.map(s => s.id === tempId ? { ...s, id } : s);
                    localStorage.setItem(cacheKey, JSON.stringify(next));
                    return next;
                });
            } catch (err) {
                setShips(prev => {
                    const next = prev.filter(s => s.id !== tempId);
                    localStorage.setItem(cacheKey, JSON.stringify(next));
                    return next;
                });
                console.error("Lỗi khi thêm tàu:", err);
                throw err;
            }
        }
    };

    const handleUpdate = async (ship: Ship) => {
        const updatedShip = { ...ship, division: ship.division || division || 'SAT_THEP' };
        // Cập nhật UI và localStorage ngay lập tức
        setShips(prev => {
            const next = prev.map(s => s.id === updatedShip.id ? updatedShip : s);
            localStorage.setItem(cacheKey, JSON.stringify(next));
            return next;
        });

        if (isConfigured()) {
            try {
                await api.updateShip(updatedShip);
            } catch (err) {
                console.error("Lỗi khi cập nhật tàu:", err);
                throw err;
            }
        }
    };

    const handleBatchUpdate = async (updatedShipsList: Ship[]) => {
        if (updatedShipsList.length === 0) return;
        const map = new Map(updatedShipsList.map(s => [s.id, { ...s, division: s.division || division || 'SAT_THEP' }]));

        // Cập nhật UI và localStorage ngay lập tức
        setShips(prev => {
            const next = prev.map(s => map.get(s.id) || s);
            localStorage.setItem(cacheKey, JSON.stringify(next));
            return next;
        });

        if (isConfigured()) {
            try {
                await Promise.all(
                    updatedShipsList.map(s => api.updateShip({ ...s, division: s.division || division || 'SAT_THEP' }))
                );
            } catch (err) {
                console.error("Lỗi khi cập nhật hàng loạt tàu:", err);
                throw err;
            }
        }
    };

    const handleDelete = async (id: string) => {
        // Cập nhật UI và localStorage ngay lập tức
        setShips(prev => {
            const next = prev.filter(s => s.id !== id);
            localStorage.setItem(cacheKey, JSON.stringify(next));
            return next;
        });

        if (isConfigured()) {
            try {
                await api.deleteShip(id);
            } catch (err) {
                console.error("Lỗi khi xóa tàu:", err);
                throw err;
            }
        }
    };

    return {
        ships,
        loading,
        error,
        addShip: handleAdd,
        updateShip: handleUpdate,
        batchUpdateShips: handleBatchUpdate,
        deleteShip: handleDelete,
        refresh: loadShips,
    };
}
