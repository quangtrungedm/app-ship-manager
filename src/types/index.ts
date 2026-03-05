export type ShipStatus = 'waiting' | 'entering' | 'loading' | 'completed';

export interface Ship {
    id: string;
    name: string;
    arrivalDate: string; // ISO string
    completionDate?: string; // ISO string
    weight: number; // in tons
    division?: string;
    status?: ShipStatus;
    documents: Document[];
    bossNotes?: string;
}

export interface Document {
    id: string;
    name: string;
    url: string;
}
