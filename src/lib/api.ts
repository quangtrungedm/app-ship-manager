import { Ship, Document as ShipDocument } from '../types';
import { APPS_SCRIPT_URL, isConfigured } from './config';

// ── API Service for Google Sheets ──

async function request(method: 'GET' | 'POST', body?: unknown) {
    if (!isConfigured()) throw new Error('API chưa được cấu hình');

    const options: RequestInit = { method };

    if (method === 'POST') {
        options.body = JSON.stringify(body);
        options.headers = { 'Content-Type': 'text/plain' }; // Apps Script quirk
    }

    const res = await fetch(APPS_SCRIPT_URL, options);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'Unknown error');
    return data;
}

// ── Ships CRUD ──

export async function fetchShips(): Promise<Ship[]> {
    const data = await request('GET');
    return (data.ships || []).map(parseShip);
}

export async function addShip(ship: Omit<Ship, 'id'>): Promise<{ id: string }> {
    const data = await request('POST', {
        action: 'add',
        ship: serializeShip(ship),
    });
    return { id: data.id };
}

export async function updateShip(ship: Ship): Promise<void> {
    await request('POST', {
        action: 'update',
        ship: serializeShip(ship),
    });
}

export async function deleteShip(id: string): Promise<void> {
    await request('POST', { action: 'delete', id });
}

// ── File Upload ──

export async function uploadFile(file: File): Promise<ShipDocument> {
    const base64 = await fileToBase64(file);

    const data = await request('POST', {
        action: 'upload',
        fileName: file.name,
        mimeType: file.type,
        fileData: base64,
    });

    return {
        id: data.fileId,
        name: data.fileName,
        url: data.fileUrl,
    };
}

// ── Helpers ──

function parseShip(raw: Record<string, unknown>): Ship {
    return {
        id: String(raw.id),
        name: String(raw.name),
        arrivalDate: String(raw.arrivalDate),
        completionDate: raw.completionDate ? String(raw.completionDate) : undefined,
        weight: Number(raw.weight),
        division: raw.division ? String(raw.division) : undefined,
        documents: Array.isArray(raw.documents) ? raw.documents : [],
    };
}

function serializeShip(ship: Partial<Ship>) {
    return {
        ...ship,
        documents: ship.documents || [],
    };
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (data:mime;base64,...)
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
