
import React, { useState, useEffect, useRef } from 'react';
import { SubscriptionStep, UserData, ParcelType, MOCK_PARCELS, MOCK_SUBSCRIPTIONS, SubscriptionRecord, SystemSettings, DEFAULT_SETTINGS, COUNTRIES } from './types';
import StepIndicator from './components/StepIndicator';
import Button from './components/Button';
import AdminPanel from './components/AdminPanel';
import { CheckCircle, MapPin, User, CreditCard, FileText, Smartphone, Clock, ChevronLeft, ChevronRight, Info, Building2, Phone, ShieldCheck, Lock, AlertTriangle, MessageCircle, AlertCircle, X, Download, Home, DollarSign } from 'lucide-react';
import { supabase, safeSupabaseQuery } from './lib/supabaseClient';

// --- COLORS CONSTANTS ---
const BRAND_GREEN = "#009640"; // SONATUR GREEN

// --- STEP COMPONENTS ---

const StepConditions: React.FC<{ accepted: boolean; onToggle: () => void; text: string }> = ({ accepted, onToggle, text }) => (
  <div className="space-y-4">
    <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#009640]">
      <div className="flex items-center gap-2 mb-4 text-[#009640] font-bold text-lg border-b pb-2">
        <FileText size={24} />
        Conditions Générales de Souscription
      </div>
      <div className="prose prose-sm text-gray-700 max-h-[60vh] overflow-y-auto mb-6 bg-gray-50 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap font-medium">
        {text}
      </div>
      <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-green-50 transition border border-transparent hover:border-green-200">
        <input 
          type="checkbox" 
          checked={accepted} 
          onChange={onToggle}
          className="mt-1 h-5 w-5 text-[#009640] focus:ring-[#009640] border-gray-300 rounded" 
        />
        <span className="text-gray-800 font-bold select-none">J'accepte les conditions générales</span>
      </label>
    </div>
  </div>
);

const StepIdentification: React.FC<{ data: UserData; onChange: (field: keyof UserData, value: string) => void }> = ({ data, onChange }) => {
  const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009640] focus:border-[#009640] outline-none transition";
  
  return (
    <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <User className="text-[#009640]" /> Informations Personnelles
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1">Nom complet *</label>
          <input 
            type="text" 
            value={data.fullName} 
            onChange={(e) => onChange('fullName', e.target.value)} 
            className={inputClass}
            placeholder="Ex: OUEDRAOGO Jean"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone *</label>
          <input 
            type="tel" 
            value={data.phone} 
            onChange={(e) => onChange('phone', e.target.value)} 
            className={inputClass}
            placeholder="Ex: 70000000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (Facultatif)</label>
          <input 
              type="email" 
              value={data.email || ''} 
              onChange={(e) => onChange('email', e.target.value)} 
              className={inputClass}
              placeholder="Ex: jean@example.bf"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Date de naissance *</label>
          <input 
            type="date" 
            value={data.birthDate} 
            onChange={(e) => onChange('birthDate', e.target.value)} 
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Lieu de naissance *</label>
          <input 
            type="text" 
            value={data.birthPlace} 
            onChange={(e) => onChange('birthPlace', e.target.value)} 
            className={inputClass}
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Genre *</label>
          <select value={data.gender} onChange={(e) => onChange('gender', e.target.value)} className={inputClass}>
            <option value="">Sélectionner</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>
        </div>
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Profession *</label>
            <input 
                type="text" 
                value={data.profession} 
                onChange={(e) => onChange('profession', e.target.value)} 
                className={inputClass}
            />
        </div>

        <div className="md:col-span-2 border-t pt-4 mt-2">
            <h4 className="font-bold text-gray-700 mb-3">Pièce d'identité</h4>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Type de document *</label>
          <select value={data.idType} onChange={(e) => onChange('idType', e.target.value)} className={inputClass}>
            <option value="">Sélectionner</option>
            <option value="CNIB">CNIB</option>
            <option value="Passeport">Passeport</option>
            <option value="Permis de conduire">Permis de conduire</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Numéro du document *</label>
          <input 
            type="text" 
            value={data.idNumber} 
            onChange={(e) => onChange('idNumber', e.target.value)} 
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Date de délivrance *</label>
          <input 
            type="date" 
            value={data.idIssueDate} 
            onChange={(e) => onChange('idIssueDate', e.target.value)} 
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Pays d'origine *</label>
          <select value={data.country} onChange={(e) => onChange('country', e.target.value)} className={inputClass}>
            <option value="">Sélectionner un pays</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="md:col-span-2 border-t pt-4 mt-2">
            <h4 className="font-bold text-gray-700 mb-3">Adresse</h4>
        </div>

        <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Type d'adresse *</label>
             <select value={data.addressType} onChange={(e) => onChange('addressType', e.target.value)} className={inputClass}>
                <option value="">Sélectionner</option>
                <option value="Residence">Résidence</option>
                <option value="Bureau">Bureau</option>
             </select>
        </div>
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nom résidence / Adresse *</label>
            <input 
                type="text" 
                value={data.address} 
                onChange={(e) => onChange('address', e.target.value)} 
                className={inputClass}
                placeholder="Quartier, Secteur..."
            />
        </div>

      </div>
      <p className="text-xs text-red-500 italic mt-4">* Tous les champs marqués sont obligatoires</p>
    </div>
  );
};

const StepSiteSelection: React.FC<{ onSelect: (site: string) => void }> = ({ onSelect }) => (
    <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Vente des parcelles SONATUR</h2>
        <div className="grid grid-cols-1 gap-4">
            {[
                { id: 'ZINIARE', label: 'Ziniaré', desc: 'Site principal' },
                { id: 'BINDOUGOUSSO', label: 'Bindougousso', desc: 'Bobo-Dioulasso' },
                { id: 'OURODARA', label: 'OuroDara', desc: 'Zone communale' }
            ].map((site) => (
                <button
                    key={site.id}
                    onClick={() => onSelect(site.id)}
                    className="flex items-center p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-[#009640] hover:bg-green-50 transition shadow-sm group text-left"
                >
                    <div className="w-12 h-12 bg-green-100 text-[#009640] rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{site.label}</h3>
                        <p className="text-sm text-gray-500">{site.desc}</p>
                    </div>
                    <div className="ml-auto text-gray-300 group-hover:text-[#009640]">
                        <ChevronRight size={24} />
                    </div>
                </button>
            ))}
        </div>
    </div>
);

const StepParcelList: React.FC<{ 
    parcels: ParcelType[]; 
    site: string;
    selected: ParcelType | null; 
    onSelect: (parcel: ParcelType) => void;
}> = ({ parcels, site, selected, onSelect }) => {
    // Filter by Site
    const siteParcels = parcels.filter(p => p.site === site);
    
    // Extract unique categories for filter tabs
    const categories = Array.from(new Set(siteParcels.map(p => p.category)));
    const [activeCat, setActiveCat] = useState<string>(categories[0] || '');

    useEffect(() => {
        if(categories.length > 0 && !activeCat) setActiveCat(categories[0]);
    }, [categories, activeCat]);

    const displayParcels = siteParcels.filter(p => p.category === activeCat);

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-700">Parcelles disponibles à {site}</h2>
            
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors
                            ${activeCat === cat 
                                ? 'bg-[#009640] text-white shadow-md' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {displayParcels.length > 0 ? displayParcels.map(parcel => (
                    <div 
                        key={parcel.id}
                        onClick={() => parcel.status === 'AVAILABLE' && onSelect(parcel)}
                        className={`border rounded-xl p-4 flex flex-col gap-3 relative transition-all
                            ${selected?.id === parcel.id ? 'border-[#009640] bg-green-50 ring-1 ring-[#009640]' : 'border-gray-200 bg-white'}
                            ${parcel.status !== 'AVAILABLE' ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{parcel.id}</span>
                                <h4 className="font-bold text-gray-800 mt-1">{parcel.category}</h4>
                                <p className="text-xs text-gray-500">{parcel.area} m² à {parcel.pricePerM2.toLocaleString()} F/m²</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-[#009640] text-lg">{parcel.totalPrice.toLocaleString()} F</p>
                                {parcel.status !== 'AVAILABLE' && (
                                    <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded mt-1">
                                        {parcel.status === 'SOLD' ? 'VENDU' : 'RÉSERVÉ'}
                                    </span>
                                )}
                            </div>
                        </div>
                        {selected?.id === parcel.id && (
                            <div className="absolute top-2 right-2 text-[#009640]">
                                <CheckCircle size={20} />
                            </div>
                        )}
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-8">Aucune parcelle disponible dans cette catégorie.</p>
                )}
            </div>
        </div>
    );
};

const StepRecap: React.FC<{
    userData: UserData;
    parcel: ParcelType;
    settings: SystemSettings;
    onConfirm: () => void;
}> = ({ userData, parcel, settings, onConfirm }) => {
    // Determine Deposit % based on category logic (keywords)
    const isCommercial = parcel.category.toLowerCase().includes('commerce');
    const depositPercent = isCommercial ? settings.depositPercentCommercial : settings.depositPercentHousing;
    
    const depositAmount = Math.round(parcel.totalPrice * (depositPercent / 100));
    const remainingBalance = parcel.totalPrice - depositAmount;

    return (
        <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-yellow-800">
                    <p className="font-bold mb-1">Attention</p>
                    <p>{settings.paymentWarningText}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={18} /> Récapitulatif de votre souscription
                    </h3>
                </div>
                <div className="p-6 space-y-4 text-sm">
                    {/* Infos Client */}
                    <div className="grid grid-cols-2 gap-2 border-b border-dashed pb-4">
                        <span className="text-gray-500">Nom complet</span>
                        <span className="font-bold text-right">{userData.fullName}</span>
                        <span className="text-gray-500">Téléphone</span>
                        <span className="font-bold text-right">{userData.phone}</span>
                        <span className="text-gray-500">Document</span>
                        <span className="font-bold text-right">{userData.idType} - {userData.idNumber}</span>
                    </div>

                    {/* Infos Parcelle */}
                    <div className="grid grid-cols-2 gap-2 border-b border-dashed pb-4">
                        <span className="text-gray-500">Site</span>
                        <span className="font-bold text-right">{parcel.site}</span>
                        <span className="text-gray-500">Parcelle</span>
                        <span className="font-mono font-bold text-right">{parcel.id}</span>
                        <span className="text-gray-500">Type</span>
                        <span className="font-bold text-right">{parcel.category}</span>
                    </div>

                    {/* Financier */}
                    <div className="bg-green-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Prix Total Parcelle</span>
                            <span className="font-bold">{parcel.totalPrice.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Acompte à payer ({depositPercent}%)</span>
                            <span className="font-bold">{depositAmount.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs">
                            <span>Reste à payer (sur 12 mois)</span>
                            <span>{remainingBalance.toLocaleString()} FCFA</span>
                        </div>
                        <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                            <span className="font-bold text-[#009640] uppercase">Frais de souscription</span>
                            <span className="font-bold text-xl text-[#009640]">{parcel.subscriptionFee.toLocaleString()} FCFA</span>
                        </div>
                    </div>
                </div>
            </div>

            <Button onClick={onConfirm} className="w-full bg-[#009640] hover:bg-green-800 text-lg py-4">
                Payer via Faso Arzeka <ChevronRight className="ml-2" />
            </Button>
            
            {/* Timer visual */}
            <div className="flex justify-center items-center gap-2 text-red-600 font-mono font-bold bg-red-50 p-2 rounded-lg text-sm">
                <Clock size={16} /> Temps restant pour valider : 20:00
            </div>
        </div>
    );
};

const StepPayment: React.FC<{ 
    userData: UserData; 
    parcel: ParcelType; 
    settings: SystemSettings;
    onFinish: () => void;
}> = ({ userData, parcel, settings, onFinish }) => {
    const [timeLeft, setTimeLeft] = useState(settings.timerDurationMinutes * 60);
    const [method, setMethod] = useState<'ORANGE' | 'MOOV' | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleWhatsAppRedirect = () => {
        const message = `Bonjour, j’ai effectué le paiement de ma souscription SONATUR.
Nom : ${userData.fullName}
Téléphone : ${userData.phone}
Site : ${parcel.site}
Parcelle : ${parcel.id}
Réseau : ${method === 'ORANGE' ? 'Orange Money' : 'Moov Money'}
Montant : ${parcel.subscriptionFee.toLocaleString()} FCFA
Merci de confirmer la réception.`;

        const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        onFinish();
    };

    const instructions = method === 'ORANGE' ? settings.orangeMoney : settings.moovMoney;

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-10 bg-white py-2 shadow-sm border-b flex justify-between items-center px-4 -mx-4">
                <span className="text-sm font-bold text-gray-500">Paiement Sécurisé</span>
                <div className="flex items-center gap-2 text-red-600 font-mono font-bold bg-red-50 px-3 py-1 rounded-full text-sm animate-pulse">
                    <Clock size={16} /> {formatTime(timeLeft)}
                </div>
            </div>

            {!method ? (
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <button 
                        onClick={() => setMethod('ORANGE')}
                        className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition group"
                    >
                        <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white mb-3 shadow-lg">
                            <Smartphone size={32} />
                        </div>
                        <span className="font-bold text-gray-800">Orange Money</span>
                    </button>

                    <button 
                        onClick={() => setMethod('MOOV')}
                        className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group"
                    >
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white mb-3 shadow-lg">
                            <Smartphone size={32} />
                        </div>
                        <span className="font-bold text-gray-800">Moov Money</span>
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5">
                    <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2">
                            Instructions {method === 'ORANGE' ? 'Orange Money' : 'Moov Money'}
                        </h3>
                        <button onClick={() => setMethod(null)} className="text-xs text-gray-300 hover:text-white underline">
                            Changer
                        </button>
                    </div>
                    <div className="p-6 space-y-6">
                         <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                            <strong>Montant des frais de souscription à payer :</strong> <span className="text-lg font-bold ml-2 block sm:inline">{parcel.subscriptionFee.toLocaleString()} FCFA</span>
                         </div>

                         <ol className="space-y-3 text-sm text-gray-700">
                            {instructions.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-3">
                                    <span className="font-bold text-[#009640]">{idx + 1}.</span>
                                    <span>{step.replace("MONTANT", parcel.subscriptionFee.toLocaleString())}</span>
                                </li>
                            ))}
                         </ol>

                         <div className="pt-4">
                             <Button onClick={handleWhatsAppRedirect} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                                <MessageCircle className="mr-2" /> Envoyer sur WhatsApp
                             </Button>
                             <p className="text-xs text-center text-gray-500 mt-2">
                                Après paiement, cliquez pour envoyer la preuve et finaliser votre souscription.
                             </p>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN APP ---

export default function App() {
  const [step, setStep] = useState<SubscriptionStep>(SubscriptionStep.CONDITIONS);
  const [conditionsAccepted, setConditionsAccepted] = useState(false);
  
  const [userData, setUserData] = useState<UserData>({
    fullName: '', phone: '', email: '', birthDate: '', birthPlace: '',
    profession: '', gender: '', idType: '', idNumber: '',
    idIssueDate: '', addressType: '', address: '', country: ''
  });

  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelType | null>(null);
  
  // Settings & Data
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [parcels, setParcels] = useState<ParcelType[]>(MOCK_PARCELS);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(MOCK_SUBSCRIPTIONS);
  
  // Admin Login
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPin, setAdminPin] = useState('');

  // Initial Load (Simulated)
  useEffect(() => {
     // In a real app, fetch settings from Supabase here
     // safeSupabaseQuery(supabase.from('settings').select('*').single()).then(...)
  }, []);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  // Secret Admin Trigger
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const handleSecretAdminAccess = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current > 1000) clickCountRef.current = 0;
    clickCountRef.current += 1;
    lastClickTimeRef.current = now;
    if (clickCountRef.current >= 5) {
      setIsAdminLoginOpen(true);
      clickCountRef.current = 0;
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if(adminPin === '1306') setIsAdminLoggedIn(true);
  };

  if (isAdminLoggedIn) {
      return (
          <AdminPanel 
            parcels={parcels}
            subscriptions={subscriptions}
            settings={systemSettings}
            onUpdateSettings={setSystemSettings}
            onLogout={() => setIsAdminLoggedIn(false)}
            onAddParcel={(p) => setParcels([...parcels, p])}
            onUpdateParcel={(p) => setParcels(parcels.map(Px => Px.id === p.id ? p : Px))}
            onDeleteParcel={(id) => setParcels(parcels.filter(p => p.id !== id))}
            onUpdateSubscription={() => {}} 
            lastEmailSent={null}
          />
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-30 border-b border-[#009640]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {/* Logo Placeholder */}
             <div className="w-10 h-10 bg-[#009640] rounded-lg flex items-center justify-center text-white shadow-sm">
                <Building2 size={24} />
             </div>
             <div>
                 <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">SONATUR</h1>
                 <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Souscription en ligne</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <a href={`https://wa.me/${systemSettings.whatsappNumber}`} className="bg-green-100 text-green-700 p-2 rounded-full">
                <MessageCircle size={20} />
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 pt-6">
        {step < SubscriptionStep.CONFIRMATION && <StepIndicator currentStep={step} />}

        <div className="mt-6">
            {step === SubscriptionStep.CONDITIONS && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <StepConditions 
                        accepted={conditionsAccepted} 
                        onToggle={() => setConditionsAccepted(!conditionsAccepted)}
                        text={systemSettings.conditionsText}
                    />
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleNext} disabled={!conditionsAccepted} className="bg-[#009640]">
                            Suivant <ChevronRight className="ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {step === SubscriptionStep.IDENTIFICATION && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <StepIdentification data={userData} onChange={(k, v) => setUserData({...userData, [k]: v})} />
                    <div className="mt-6 flex justify-between">
                        <Button variant="outline" onClick={handleBack}>Retour</Button>
                        <Button 
                            onClick={handleNext} 
                            disabled={!userData.fullName || !userData.phone || !userData.idNumber || !userData.country}
                            className="bg-[#009640]"
                        >
                            Suivant <ChevronRight className="ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {step === SubscriptionStep.SITE_SELECTION && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <StepSiteSelection onSelect={(site) => { setSelectedSite(site); handleNext(); }} />
                    <div className="mt-6 flex justify-start">
                        <Button variant="outline" onClick={handleBack}>Retour</Button>
                    </div>
                </div>
            )}

            {step === SubscriptionStep.PARCEL_LIST && selectedSite && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <StepParcelList 
                        parcels={parcels} 
                        site={selectedSite}
                        selected={selectedParcel}
                        onSelect={setSelectedParcel}
                    />
                    <div className="mt-6 flex justify-between">
                        <Button variant="outline" onClick={handleBack}>Retour</Button>
                        <Button onClick={handleNext} disabled={!selectedParcel} className="bg-[#009640]">
                            Suivant <ChevronRight className="ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {step === SubscriptionStep.RECAP && selectedParcel && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <StepRecap 
                        userData={userData}
                        parcel={selectedParcel}
                        settings={systemSettings}
                        onConfirm={handleNext}
                    />
                    <div className="mt-4 flex justify-start">
                         <Button variant="outline" onClick={handleBack}>Modifier</Button>
                    </div>
                </div>
            )}

            {step === SubscriptionStep.PAYMENT && selectedParcel && (
                 <div className="animate-in fade-in slide-in-from-bottom-4">
                    <StepPayment 
                        userData={userData}
                        parcel={selectedParcel}
                        settings={systemSettings}
                        onFinish={handleNext}
                    />
                 </div>
            )}

            {step === SubscriptionStep.CONFIRMATION && (
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center animate-in zoom-in pt-12">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-[#009640]">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Merci pour votre souscription !</h2>
                    <p className="text-gray-600 mb-8">Votre paiement est en cours de vérification par nos services.</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Retour à l'accueil
                    </Button>
                </div>
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8 text-center text-sm text-gray-500">
         <p className="font-bold text-[#009640] mb-2">SONATUR - Bâtir un cadre de vie idéal</p>
         <p onClick={handleSecretAdminAccess} className="cursor-default">
            &copy; {new Date().getFullYear()} Tous droits réservés.
         </p>
      </footer>

      {/* Floating WhatsApp */}
      <a 
         href={`https://wa.me/${systemSettings.whatsappNumber}`}
         target="_blank"
         rel="noreferrer"
         className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-50 flex items-center justify-center"
      >
        <MessageCircle size={28} />
      </a>

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="bg-white p-6 rounded-xl w-full max-w-xs relative">
              <button onClick={() => setIsAdminLoginOpen(false)} className="absolute top-2 right-2 text-gray-400"><X size={20}/></button>
              <h2 className="text-center font-bold mb-4">Admin Access</h2>
              <form onSubmit={handleAdminLogin}>
                  <input 
                    type="password" 
                    className="w-full border p-2 rounded mb-4 text-center tracking-widest" 
                    placeholder="PIN" 
                    value={adminPin} 
                    onChange={e => setAdminPin(e.target.value)}
                  />
                  <Button type="submit" className="w-full bg-[#009640]">Entrer</Button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
