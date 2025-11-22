
export enum SubscriptionStep {
  CONDITIONS = 0,
  IDENTIFICATION = 1,
  PROGRAM = 2,
  PARCEL = 3,
  PAYMENT = 4,
  RECAP = 5,
  CONFIRMATION = 6
}

export type ParcelStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';
export type SubscriptionStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';

export interface ParcelType {
  id: string;
  category: string;
  area: number; // m2
  pricePerM2: number;
  totalPrice: number;
  subscriptionFee: number;
  description: string;
  status: ParcelStatus;
}

export interface UserData {
  fullName: string;
  phone: string;
  email?: string;
  birthDate: string;
  birthPlace: string;
  profession: string;
  gender: 'Homme' | 'Femme' | 'Autre' | '';
  idType: 'CNIB' | 'Passeport' | '';
  idNumber: string;
  idIssueDate: string;
  idIssuePlace: string;
  address: string;
  city: string;
}

export interface StatusHistoryEntry {
  status: SubscriptionStatus;
  date: string;
  updatedBy: string; // 'SYSTEM', 'ADMIN', 'USER'
  comment?: string;
}

export interface SubscriptionRecord {
  id: string;
  date: string;
  userData: UserData;
  parcelId: string;
  status: SubscriptionStatus;
  paymentMethod: string;
  history: StatusHistoryEntry[];
}

export interface SubscriptionState {
  step: SubscriptionStep;
  conditionsAccepted: boolean;
  userData: UserData;
  selectedProgram: string | null;
  selectedParcel: ParcelType | null;
  paymentMethod: 'ORANGE_MONEY' | 'MOOV_MONEY' | null;
  paymentStatus: 'PENDING' | 'COMPLETED';
}

const getEnv = (key: string) => {
  return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.[key] : undefined) || 
         (typeof process !== 'undefined' ? process.env?.[key] : undefined);
};

// Configuration WhatsApp avec fallback sur 22644386852
export const SONATUR_PHONE = getEnv('NEXT_PUBLIC_WHATSAPP_NUMBER') || getEnv('VITE_WHATSAPP_NUMBER') || "22644386852";

export const MOCK_PARCELS: ParcelType[] = [
  {
    id: "PARCEL-1757171468136895",
    category: "Habitation Ordinaire",
    area: 374.23,
    pricePerM2: 6300,
    totalPrice: 2357649,
    subscriptionFee: 50000,
    description: "Zone: Habitation Ordinaire (L2), Section A, Lot 06",
    status: 'AVAILABLE'
  },
  {
    id: "PARCEL-1757171533503005",
    category: "Habitation Ordinaire",
    area: 247.67,
    pricePerM2: 6300,
    totalPrice: 1560321,
    subscriptionFee: 50000,
    description: "Zone: Habitation Ordinaire (L2), Section B, Lot 12",
    status: 'AVAILABLE'
  },
  {
    id: "PARCEL-1757171598634028",
    category: "Habitation Angle",
    area: 407.2,
    pricePerM2: 7650,
    totalPrice: 3115080,
    subscriptionFee: 50000,
    description: "Zone: Habitation Angle, Section C, Lot 01",
    status: 'AVAILABLE'
  },
  {
    id: "PARCEL-COMM-88293",
    category: "Commerce Voie Non Bitumée",
    area: 300.00,
    pricePerM2: 9900,
    totalPrice: 2970000,
    subscriptionFee: 50000,
    description: "Zone: Commerciale, Section D, Lot 04",
    status: 'AVAILABLE'
  },
  {
    id: "PARCEL-COMM-BITUME-99123",
    category: "Commerce Voie Bitumée",
    area: 450.00,
    pricePerM2: 15000,
    totalPrice: 6750000,
    subscriptionFee: 50000,
    description: "Zone: Commerciale Prestige, Façade Goudronnée, Section E, Lot 05",
    status: 'RESERVED'
  },
  {
    id: "PARCEL-SOC-1758282910",
    category: "Logement Social",
    area: 240.00,
    pricePerM2: 3500,
    totalPrice: 840000,
    subscriptionFee: 50000,
    description: "Zone: Sociale, Section F, Lot 22",
    status: 'AVAILABLE'
  },
  {
    id: "PARCEL-SOC-EXT-223",
    category: "Logement Social",
    area: 300.00,
    pricePerM2: 3500,
    totalPrice: 1050000,
    subscriptionFee: 50000,
    description: "Zone: Sociale Extension, Section K, Lot 14",
    status: 'AVAILABLE'
  },
  {
    id: "PARCEL-RES-1759393921",
    category: "Habitation Pan coupé",
    area: 500.00,
    pricePerM2: 7000,
    totalPrice: 3500000,
    subscriptionFee: 50000,
    description: "Zone: Résidentielle (L3), Section G, Lot 08",
    status: 'SOLD'
  },
  {
    id: "PARCEL-ART-28394",
    category: "Zone Artisanale",
    area: 400,
    pricePerM2: 5000,
    totalPrice: 2000000,
    subscriptionFee: 50000,
    description: "Zone: Artisanale, Section H, Lot 15",
    status: 'AVAILABLE'
  },
  {
    id: "PARCEL-IND-55920",
    category: "Zone Industrielle",
    area: 1000,
    pricePerM2: 4500,
    totalPrice: 4500000,
    subscriptionFee: 50000,
    description: "Zone: Industrielle, Section I, Lot 02",
    status: 'AVAILABLE'
  },
  {
    id: "PARCEL-RES-LUX-10293",
    category: "Résidentiel Haut Standing",
    area: 600,
    pricePerM2: 12000,
    totalPrice: 7200000,
    subscriptionFee: 50000,
    description: "Zone: Résidentielle (L1), Section J, Lot 09",
    status: 'AVAILABLE'
  }
];

export const MOCK_SUBSCRIPTIONS: SubscriptionRecord[] = [
  {
    id: "SUB-001",
    date: "2023-10-25",
    userData: {
      fullName: "Ilboudo Karim",
      phone: "70223344",
      email: "karim@test.bf",
      birthDate: "1985-05-12",
      birthPlace: "Ouagadougou",
      profession: "Commerçant",
      gender: "Homme",
      idType: "CNIB",
      idNumber: "B1234567",
      idIssueDate: "2020-01-01",
      idIssuePlace: "Ouaga",
      city: "Ouagadougou",
      address: "Secteur 25, Rue 12"
    },
    parcelId: "PARCEL-1757171533503005",
    status: 'PENDING',
    paymentMethod: 'ORANGE_MONEY',
    history: [
      { status: 'PENDING', date: "2023-10-25T10:00:00Z", updatedBy: 'SYSTEM', comment: 'Création du dossier' }
    ]
  },
  {
    id: "SUB-002",
    date: "2023-10-24",
    userData: {
      fullName: "Savadogo Aïcha",
      phone: "76554433",
      birthDate: "1992-08-20",
      birthPlace: "Bobo-Dioulasso",
      profession: "Enseignante",
      gender: "Femme",
      idType: "CNIB",
      idNumber: "B9876543",
      idIssueDate: "2021-03-15",
      idIssuePlace: "Bobo",
      city: "Bobo-Dioulasso",
      address: "Secteur 5"
    },
    parcelId: "PARCEL-RES-1759393921",
    status: 'VALIDATED',
    paymentMethod: 'MOOV_MONEY',
    history: [
      { status: 'PENDING', date: "2023-10-24T09:30:00Z", updatedBy: 'SYSTEM' },
      { status: 'VALIDATED', date: "2023-10-24T14:20:00Z", updatedBy: 'ADMIN', comment: 'Paiement vérifié' }
    ]
  }
];
