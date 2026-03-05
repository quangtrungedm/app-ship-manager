export interface Ship {
    id: string;
    name: string;
    arrivalDate: string; // ISO string
    completionDate?: string; // ISO string
    weight: number; // in tons
    division?: string;
    documents: Document[];
    bossNotes?: string;
}

export interface Document {
    id: string;
    name: string;
    url: string;
}
