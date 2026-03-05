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
    const [ships, setShips] = useState<Ship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadShips = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (isConfigured()) {
                const data = await api.fetchShips();
                setShips(data);
            } else {
                // Fallback to mock data
                setShips(MOCK_SHIPS);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
            setShips(MOCK_SHIPS); // fallback on error
        } finally {
            setLoading(false);
        }
    }, []);

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
