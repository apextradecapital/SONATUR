
export enum SubscriptionStep {
  CONDITIONS = 0,
  IDENTIFICATION = 1,
  SITE_SELECTION = 2,
  PARCEL_TYPE = 3,
  PARCEL_LIST = 4,
  RECAP = 5,
  PAYMENT = 6,
  CONFIRMATION = 7
}

export type ParcelStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';
export type SubscriptionStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';

export interface ParcelType {
  id: string;
  site: string; // Ex: 'ZINIARE', 'BOBO', 'OURODARA'
  category: string;
  area: number; // m2
  pricePerM2: number;
  totalPrice: number;
  subscriptionFee: number;
  description: string;
  status: ParcelStatus;
  imageUrl: string;
}

export interface UserData {
  fullName: string;
  phone: string;
  email?: string;
  birthDate: string;
  birthPlace: string;
  profession: string;
  gender: 'Homme' | 'Femme' | 'Autre' | '';
  idType: 'CNIB' | 'Passeport' | 'Permis de conduire' | '';
  idNumber: string;
  idIssueDate: string;
  addressType: 'Residence' | 'Bureau' | '';
  address: string; // Nom de la résidence / adresse complète
  country: string;
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

// --- CONFIGURATION SYSTEME ---

export interface PaymentInstructionConfig {
  ussdCode: string;
  merchantCode: string;
  recipientName?: string; // Nom du bénéficiaire (ex: ADAMA SERI)
  steps: string[];
}

export interface SystemSettings {
  whatsappNumber: string;
  timerDurationMinutes: number; // Durée du timer en minutes
  depositPercentHousing: number; // Ex: 10
  depositPercentCommercial: number; // Ex: 20
  
  // Textes configurables
  conditionsText: string;
  paymentWarningText: string;
  
  orangeMoney: PaymentInstructionConfig;
  moovMoney: PaymentInstructionConfig;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  whatsappNumber: "22644386852",
  timerDurationMinutes: 20,
  depositPercentHousing: 10,
  depositPercentCommercial: 20,
  conditionsText: `Conditions de participation à l'acquisition d'une parcelle :
1. Toute souscription donne automatiquement droit à l'attribution d'une parcelle.
2. Pour confirmer votre intérêt et sécuriser votre parcelle, vous devez procéder au paiement des frais de réservation pour la parcelle désirée.
3. Les montants des frais de réservation à régler sont définis comme suit :
   - 10 % du prix total pour une parcelle à usage d'habitation ;
   - 20 % du prix total pour une parcelle à usage commercial.
4. Un reçu officiel vous sera délivré après paiement. Ce document devra être présenté lors du dépôt physique de votre dossier.
5. Le solde restant du prix total de la parcelle devra être réglé dans un délai de douze (12) mois à compter de la date de vente. Le paiement peut s'effectuer par tranches.
6. Vous disposez d'un délai de cinq (5) jours à compter de la date de votre souscription pour effectuer le paiement des frais de réservation. Passé ce délai :
   - La souscription sera automatiquement annulée ;
   - Une pénalité sera appliquée avant tout remboursement éventuel des frais engagés.
7. Méthode de souscription
La vente des parcelles se fera par ordre d'arrivée et ce, dans la limite du stock disponible.

Documents requis
Pièces à fournir au plus tard le 01/01/2026 :
   - Le récépissé de souscription
   - L'original et une copie du reçu fournis par notre service technique en ligne
   - Trois (03) photocopies légalisées de la carte nationale d'identité ou du passeport en cours de validité (personne physique) ou de l'acte de naissance (enfant mineur), des Statuts et du RCCM (personne morale)
   - Un timbre fiscal de cinq cent (500) francs CFA`,
  paymentWarningText: "⚠️ Vous disposez de 20 minutes pour effectuer votre paiement, sinon la priorité sur cette parcelle sera perdue.",
  orangeMoney: {
    ussdCode: "*144#",
    merchantCode: "22644386852",
    recipientName: "ADAMA SERI",
    steps: [
      "Composez *144# sur votre téléphone",
      "Sélectionnez 'Transfert d'argent'",
      "Entrez le numéro : +226 44 38 68 52 (ADAMA SERI)",
      "Entrez le montant : 50 000 FCFA",
      "Confirmez avec votre code PIN",
      "Conservez le SMS de transaction",
      "Cliquez sur 'Envoyer sur WhatsApp'"
    ]
  },
  moovMoney: {
    ussdCode: "*555#",
    merchantCode: "0000000000",
    recipientName: "SONATUR",
    steps: [
      "Composez *555# sur votre téléphone",
      "Sélectionnez 'Transfert d'argent'",
      "Entrez le numéro : 0000000000 (Non encore disponible)",
      "Entrez le montant : 50 000 FCFA",
      "Confirmez avec votre code PIN",
      "Conservez le SMS de transaction",
      "Cliquez sur 'Envoyer sur WhatsApp'"
    ]
  }
};

const getEnv = (key: string) => {
  return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.[key] : undefined) || 
         (typeof process !== 'undefined' ? process.env?.[key] : undefined);
};

export const SONATUR_PHONE = getEnv('VITE_WHATSAPP_NUMBER') || "22644386852";

// Données Mock mises à jour avec les 3 sites demandés
export const MOCK_PARCELS: ParcelType[] = [
  // ZINIARÉ
  {
    id: "ZIN-HAB-001",
    site: "ZINIARE",
    category: "Habitation Ordinaire",
    area: 374.23,
    pricePerM2: 6300,
    totalPrice: 2357649,
    subscriptionFee: 50000,
    description: "Zone: Habitation Ordinaire (L2), Section A, Lot 06. Terrain plat.",
    status: 'AVAILABLE',
    imageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "ZIN-COM-002",
    site: "ZINIARE",
    category: "Commerce",
    area: 400,
    pricePerM2: 9900,
    totalPrice: 3960000,
    subscriptionFee: 50000,
    description: "Zone commerciale stratégique, bordure de voie.",
    status: 'AVAILABLE',
    imageUrl: "https://images.unsplash.com/photo-1623228950926-47249491b520?auto=format&fit=crop&w=800&q=80"
  },
  
  // BINDOUGOUSSO (BOBO) - 2 Parcelles
  {
    id: "BOBO-BIN-01",
    site: "BINDOUGOUSSO",
    category: "Habitation Ordinaire",
    area: 300,
    pricePerM2: 7500,
    totalPrice: 2250000,
    subscriptionFee: 50000,
    description: "Section B, Lot 12. Quartier en plein développement.",
    status: 'AVAILABLE',
    imageUrl: "https://images.unsplash.com/photo-1518182170546-07661d4eea9f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "BOBO-BIN-02",
    site: "BINDOUGOUSSO",
    category: "Commerce",
    area: 500,
    pricePerM2: 12000,
    totalPrice: 6000000,
    subscriptionFee: 50000,
    description: "Zone commerciale, angle de rue principale.",
    status: 'AVAILABLE',
    imageUrl: "https://images.unsplash.com/photo-1533378154896-668f952607a4?auto=format&fit=crop&w=800&q=80"
  },

  // OURODARA - 1 Parcelle
  {
    id: "OURO-001",
    site: "OURODARA",
    category: "Habitation Ordinaire",
    area: 400,
    pricePerM2: 4500,
    totalPrice: 1800000,
    subscriptionFee: 50000,
    description: "Lotissement communal, Section C.",
    status: 'AVAILABLE',
    imageUrl: "https://images.unsplash.com/photo-1599939571322-792a326991f2?auto=format&fit=crop&w=800&q=80"
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
      addressType: "Residence",
      address: "Secteur 25, Rue 12",
      country: "Burkina Faso"
    },
    parcelId: "ZIN-HAB-001",
    status: 'PENDING',
    paymentMethod: 'ORANGE_MONEY',
    history: [
      { status: 'PENDING', date: "2023-10-25T10:00:00Z", updatedBy: 'SYSTEM', comment: 'Création du dossier' }
    ]
  }
];

export const COUNTRIES = [
  "Burkina Faso", "Côte d'Ivoire", "Mali", "Sénégal", "Togo", "Bénin", "Niger", "Ghana", 
  "Nigeria", "Cameroun", "Gabon", "Tchad", "Centrafrique", "Congo", "Autre"
];
