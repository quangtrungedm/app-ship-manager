import { useState, useEffect, useCallback } from 'react';
import { Ship } from '../types';
import { isConfigured } from './config';
import * as api from './api';
import { MOCK_SHIPS } from '../data/mockShips';

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
    const [ships, setShips] = useState<Ship[]>(() => {
        // Init from cache if available
        const cached = localStorage.getItem('ship_manager_cache');
        if (cached) {
            try { return JSON.parse(cached); } catch (e) { return []; }
        }
        return [];
    });
    // If we have cached ships, don't show full loading state initially
    const [loading, setLoading] = useState(!localStorage.getItem('ship_manager_cache'));
    const [error, setError] = useState<string | null>(null);

    const loadShips = useCallback(async () => {
        if (!isConfigured()) {
            setShips(MOCK_SHIPS);
            setLoading(false);
            return;
        }

        setError(null);
        try {
            // Background fetch
            const data = await api.fetchShips();
            setShips(data);
            localStorage.setItem('ship_manager_cache', JSON.stringify(data));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
            // Keep existing ships/cache on error, don't fallback to mock
            if (ships.length === 0) setShips(MOCK_SHIPS);
        } finally {
            setLoading(false);
        }
    }, [ships.length]);

    useEffect(() => { loadShips(); }, [loadShips]);

    const handleAdd = async (ship: Omit<Ship, 'id'>) => {
        if (isConfigured()) {
            const { id } = await api.addShip(ship);
            setShips(prev => [{ ...ship, id } as Ship, ...prev]);
        } else {
            const id = crypto.randomUUID();
            setShips(prev => [{ ...ship, id } as Ship, ...prev]);
        }
    };

    const handleUpdate = async (ship: Ship) => {
        if (isConfigured()) {
            await api.updateShip(ship);
        }
        setShips(prev => prev.map(s => s.id === ship.id ? ship : s));
    };

    const handleDelete = async (id: string) => {
        if (isConfigured()) {
            await api.deleteShip(id);
        }
        setShips(prev => prev.filter(s => s.id !== id));
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
