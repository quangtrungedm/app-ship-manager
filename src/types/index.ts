export type ShipStatus = 'waiting' | 'entering' | 'working' | 'completed';

export interface Ship {
    id: string;
    name: string;
    arrivalDate: string; // ISO string
    completionDate?: string; // ISO string
    weight: number; // in tons
    division?: string;
    status?: ShipStatus;
    isPaid?: boolean;
    port?: string;
    client?: string;
    employee?: string;
    documents: Document[];
    bossNotes?: string;
}

export interface Document {
    id: string;
    name: string;
    url: string;
}
