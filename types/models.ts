/**
 * Domain Models
 */
import { Status, Role, Coordinates } from './common';

export interface Admin {
    id: string;
    email: string;
    name: string;
    role: Role;
    organizationId?: string;
    organizationName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Organization {
    id: string;
    name: string;
    code: string; // e.g., 'org1'
    region?: string;
    status: Status;
    createdAt: string;
    updatedAt: string;
}

export interface Ward {
    id: string;
    name: string;
    phoneNumber?: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    organizationId: string;
    guardianName?: string;
    guardianPhone?: string;
    notes?: string;
    status: Status;
    createdAt: string;
    updatedAt: string;
}

export interface Beneficiary {
    id: string;
    name: string;
    status: Status;
    wardId?: string; // Associated ward if linked
    deviceStatus?: 'online' | 'offline';
    lastActiveAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BeneficiarySummary {
    id: string | number;
    name: string;
    address?: string | null;
    manager?: string | null;
    // API returns numeric status 0, 1, 2 but mapped to strings in frontend for now
    // TODO: Align API to return consistent Status enum
    status: 'WARNING' | 'NORMAL' | 'CAUTION';
    lastCall?: string | null;
    age?: number | null;
    gender?: string | null;
    type?: string | null;
}

export interface Emergency {
    id: string;
    wardId?: string;
    beneficiaryId?: string;
    wardName?: string;
    status: 'active' | 'resolved' | 'false_alarm';
    type: 'manual' | 'ai_detected' | 'fall_detection';
    description?: string;
    location?: Coordinates;
    occurredAt: string;
    resolvedAt?: string;
    resolvedBy?: string; // adminId
}

export interface Location {
    id: string;
    wardId: string;
    wardName: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    batteryLevel?: number;
    status: 'normal' | 'warning' | 'emergency';
}
