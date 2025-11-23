import React, { useState, useEffect, useRef } from 'react';
import { SubscriptionStep, UserData, ParcelType, MOCK_PARCELS, MOCK_SUBSCRIPTIONS, SubscriptionRecord, SystemSettings, DEFAULT_SETTINGS, COUNTRIES } from './types';
import StepIndicator from './components/StepIndicator';
import Button from './components/Button';
import AdminPanel from './components/AdminPanel';
import { CheckCircle, MapPin, User, FileText, Smartphone, Clock, ChevronLeft, ChevronRight, Info, Building2, AlertTriangle, MessageCircle, X, ZoomIn, Mail, Phone } from 'lucide-react';
import { supabase, safeSupabaseQuery } from './lib/supabaseClient';

// --- COLORS CONSTANTS ---
const BRAND_GREEN = "#009640"; // SONATUR GREEN

// --- HELPER: MAP DB TO FRONTEND TYPES ---
// Allows handling snake_case (DB) vs camelCase (Frontend)
const mapDbParcel = (p: any): ParcelType => ({
    id: p.id,
    site: p.site,
    category: p.category,
    area: Number(p.area),
    pricePerM2: Number(p.price_per_m2 || p.pricePerM2),
    totalPrice: Number(p.total_price || p.totalPrice),
    subscriptionFee: Number(p.subscription_fee || p.subscriptionFee),
    description: p.description,
    status: p.status,
    imageUrl: p.image_url || p.imageUrl || "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5"
});

const mapDbSubscription = (s: any): SubscriptionRecord => ({
  id: s.id,
  date: s.created_at,
  userData: s.user_data,
  parcelId: s.parcel_id,
  status: s.status,
  paymentMethod: s.payment_method,
  history: s.history || []
});

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
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Info size={12} className="text-[#009640]"/> Tel qu'il figure sur votre pièce d'identité
          </p>
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
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Info size={12} className="text-[#009640]"/> Numéro joignable (8 chiffres)
          </p>
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
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Info size={12} className="text-[#009640]"/> Ex: B1234567 pour une CNIB
          </p>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Date d'émission *</label>
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
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Info size={12} className="text-[#009640]"/> Indiquez votre secteur ou quartier de résidence
            </p>
        </div>

      </div>
      <p className="text-xs text-red-500 italic mt-4">* Tous les champs marqués sont obligatoires</p>
    </div>
  );
};

const StepSiteSelection: React.FC<{ 
    selectedSites: string[]; 
    onToggle: (siteId: string) => void; 
}> = ({ selectedSites, onToggle }) => (
    <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Vente des parcelles</h2>
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2 items-start mb-4">
             <Info size={16} className="mt-0.5 shrink-0" />
             <p>Vous pouvez sélectionner plusieurs sites pour voir l'ensemble des disponibilités.</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
            {[
                { id: 'ZINIARE', label: 'Ziniaré', desc: 'Site principal' },
                { id: 'BINDOUGOUSSO', label: 'Bindougousso', desc: 'Bobo-Dioulasso' },
                { id: 'OURODARA', label: 'OuroDara', desc: 'Zone communale' }
            ].map((site) => {
                const isSelected = selectedSites.includes(site.id);
                return (
                    <button
                        key={site.id}
                        onClick={() => onToggle(site.id)}
                        className={`flex items-center p-4 sm:p-6 border-2 rounded-xl transition shadow-sm group text-left w-full
                             ${isSelected ? 'border-[#009640] bg-green-50' : 'border-gray-100 bg-white hover:border-green-200'}
                        `}
                    >
                        <div className={`w-8 h-8 rounded border-2 flex items-center justify-center mr-4 shrink-0 transition-colors
                            ${isSelected ? 'bg-[#009640] border-[#009640] text-white' : 'border-gray-300 bg-white'}
                        `}>
                            {isSelected && <CheckCircle size={18} />}
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-bold text-lg ${isSelected ? 'text-[#009640]' : 'text-gray-800'}`}>{site.label}</h3>
                            <p className="text-sm text-gray-500">{site.desc}</p>
                        </div>
                        <div className="ml-auto text-gray-300">
                            <MapPin size={24} className={isSelected ? 'text-[#009640]' : ''} />
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
);

const StepParcelList: React.FC<{ 
    parcels: ParcelType[]; 
    sites: string[];
    selected: ParcelType | null; 
    onSelect: (parcel: ParcelType) => void;
}> = ({ parcels, sites, selected, onSelect }) => {
    // Filter by Sites
    const siteParcels = parcels.filter(p => sites.includes(p.site));
    
    // Extract unique categories for filter tabs
    const categories = Array.from(new Set(siteParcels.map(p => p.category)));
    const [activeCat, setActiveCat] = useState<string>('');
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);

    useEffect(() => {
        if(categories.length > 0 && (!activeCat || !categories.includes(activeCat))) {
            setActiveCat(categories[0]);
        }
    }, [categories, activeCat]);

    const displayParcels = siteParcels.filter(p => p.category === activeCat);

    // Helper to get friendly name
    const getSiteName = (code: string) => {
        const names: Record<string, string> = { 'ZINIARE': 'Ziniaré', 'BINDOUGOUSSO': 'Bobo', 'OURODARA': 'OuroDara' };
        return names[code] || code;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-700">Parcelles disponibles ({siteParcels.length})</h2>
            
            {/* Category Tabs */}
            {categories.length > 0 ? (
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
            ) : (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm">
                    Aucune catégorie trouvée pour les sites sélectionnés.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayParcels.length > 0 ? displayParcels.map(parcel => (
                    <div 
                        key={parcel.id}
                        onClick={() => parcel.status === 'AVAILABLE' && onSelect(parcel)}
                        className={`border rounded-xl overflow-hidden flex flex-col gap-3 relative transition-all duration-300 group
                            ${selected?.id === parcel.id ? 'border-[#009640] bg-green-50 ring-1 ring-[#009640]' : 'border-gray-200 bg-white hover:border-green-400 hover:shadow-lg hover:-translate-y-1'}
                            ${parcel.status !== 'AVAILABLE' ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {/* Image Header with Hover Effect */}
                        <div 
                            className="h-32 w-full bg-gray-200 relative overflow-hidden cursor-zoom-in"
                            onMouseEnter={() => setHoveredImage(parcel.imageUrl)}
                            onMouseLeave={() => setHoveredImage(null)}
                        >
                            <img src={parcel.imageUrl} alt={parcel.id} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                            <div className="absolute top-2 left-2 flex gap-2">
                                <span className="text-[10px] font-bold bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded uppercase tracking-wide shadow-sm">
                                    {getSiteName(parcel.site)}
                                </span>
                            </div>
                            {/* Hint overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                <ZoomIn className="text-white drop-shadow-lg" size={24} />
                            </div>
                        </div>

                        <div className="p-4 pt-2">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 block w-fit mb-1">{parcel.id}</span>
                                    <h4 className="font-bold text-gray-800 leading-tight">{parcel.category}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{parcel.area} m² à {parcel.pricePerM2.toLocaleString()} F/m²</p>
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
                        </div>

                        {selected?.id === parcel.id && (
                            <div className="absolute top-2 right-2 bg-white text-[#009640] rounded-full p-1 shadow-md">
                                <CheckCircle size={20} />
                            </div>
                        )}
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-8 col-span-full">Aucune parcelle disponible dans cette catégorie.</p>
                )}
            </div>

            {/* Large Image Hover Preview Overlay */}
            {hoveredImage && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div className="bg-white p-2 rounded-xl shadow-2xl animate-in zoom-in duration-200 border-4 border-white/50 backdrop-blur-sm">
                        <img 
                            src={hoveredImage} 
                            alt="Aperçu" 
                            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-inner"
                        />
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="bg-black/75 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md">Aperçu de la parcelle</span>
                        </div>
                    </div>
                </div>
            )}
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
                        <span className="text-gray-500">Date d'émission</span>
                        <span className="font-bold text-right">{userData.idIssueDate}</span>
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
                Payer maintenant <ChevronRight className="ml-2" />
            </Button>
            
            {/* Timer visual */}
            <div className="flex justify-center items-center gap-2 text-red-600 font-mono font-bold bg-red-50 p-2 rounded-lg text-sm">
                <Clock size={16} /> Temps restant pour valider : {settings.timerDurationMinutes}:00
            </div>
        </div>
    );
};

const StepPayment: React.FC<{ 
    userData: UserData; 
    parcel: ParcelType; 
    settings: SystemSettings;
    onFinish: (paymentMethod: string) => void;
}> = ({ userData, parcel, settings, onFinish }) => {
    const [timeLeft, setTimeLeft] = useState(settings.timerDurationMinutes * 60);
    const [method, setMethod] = useState<'ORANGE' | 'MOOV' | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

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
        const message = `Bonjour, j’ai effectué le paiement de ma souscription ${settings.companyName}.
Nom : ${userData.fullName}
Téléphone : ${userData.phone}
Site : ${parcel.site}
Parcelle : ${parcel.id}
Réseau : ${method === 'ORANGE' ? 'Orange Money' : 'Moov Money'}
Montant : ${parcel.subscriptionFee.toLocaleString()} FCFA
Merci de confirmer la réception.`;

        const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        setShowConfirmModal(true);
    };

    const instructions = method === 'ORANGE' ? settings.orangeMoney : settings.moovMoney;

    if (showConfirmModal) {
        return (
             <div className="bg-white p-6 rounded-xl border-2 border-[#009640] shadow-lg text-center space-y-6 animate-in zoom-in">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-[#009640]">
                     <MessageCircle size={40} />
                 </div>
                 <div>
                     <h3 className="text-xl font-bold text-gray-800 mb-2">Vérification Finale</h3>
                     <p className="text-gray-600 mb-4">Avez-vous bien envoyé le message de confirmation sur WhatsApp avec la capture d'écran de votre paiement ?</p>
                     <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mb-2 text-left flex gap-2">
                        <AlertTriangle className="shrink-0 w-5 h-5" />
                        <p>Sans cette confirmation WhatsApp, votre souscription ne pourra pas être validée par nos services.</p>
                     </div>
                 </div>
                 <div className="flex flex-col gap-3">
                     <Button 
                        onClick={() => method && onFinish(method)} 
                        className="bg-[#009640] py-4 text-lg"
                    >
                         Oui, c'est fait
                     </Button>
                     <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                         Non, revenir aux instructions
                     </Button>
                 </div>
             </div>
        );
    }

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
  const [animClass, setAnimClass] = useState("animate-in fade-in slide-in-from-bottom-4");
  
  const [userData, setUserData] = useState<UserData>({
    fullName: '', phone: '', email: '', birthDate: '', birthPlace: '',
    profession: '', gender: '', idType: '', idNumber: '',
    idIssueDate: '', addressType: '', address: '', country: ''
  });

  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ParcelType | null>(null);
  
  // Settings & Data
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [parcels, setParcels] = useState<ParcelType[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(MOCK_SUBSCRIPTIONS);
  
  // Admin Login
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPin, setAdminPin] = useState('');

  // Initial Load with Supabase (Graceful degradation to Mocks)
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Settings
      const { data: settingsData } = await safeSupabaseQuery<any>(
        supabase.from('settings').select('*').limit(1).single() as any
      );
      if (settingsData && settingsData.data) {
             setSystemSettings(prev => ({...prev, ...settingsData.data}));
      }

      // 2. Fetch Parcels (FETCH ALL for Admin, filtered later)
      const { data: parcelsData, error: parcelsError } = await safeSupabaseQuery<any[]>(
        supabase.from('parcels').select('*') as any
      );
      
      if (parcelsData && parcelsData.length > 0) {
        setParcels(parcelsData.map(mapDbParcel));
      } else if (parcelsError) {
        console.log("Database connection error, using MOCK data for Parcels.");
        setParcels(MOCK_PARCELS);
      } else {
        // Empty DB.
      }

      // 3. Fetch Subscriptions
      const { data: subData, error: subError } = await safeSupabaseQuery<any[]>(
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }) as any
      );

      if (subData && subData.length > 0) {
          setSubscriptions(subData.map(mapDbSubscription));
      } else if (!subError) {
          setSubscriptions([]);
      }
    };

    fetchData();
  }, []);

  const handleNext = () => {
    setAnimClass("animate-in fade-in slide-in-from-right");
    setStep(s => s + 1);
  };
  
  const handleBack = () => {
    setAnimClass("animate-in fade-in slide-in-from-left");
    setStep(s => s - 1);
  };

  // Function to save subscription to Supabase
  const handleSubscriptionFinish = async (paymentMethod: string) => {
      if (!selectedParcel) return;

      // 1. Save to Supabase
      const newSub = {
          user_data: userData,
          parcel_id: selectedParcel.id,
          status: 'PENDING',
          payment_method: paymentMethod,
          created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('subscriptions').insert([newSub]);
      
      if (error) {
          console.error("Error saving subscription:", error);
          alert("Erreur de connexion. Veuillez réessayer.");
          return;
      }

      // 2. Move to success step
      handleNext();
  };

  const handleAdminUpdateSettings = async (newSettings: SystemSettings) => {
      setSystemSettings(newSettings);
      
      // Save to Supabase (assuming ID=1 for single settings row)
      const { error } = await supabase.from('settings').upsert({ id: 1, data: newSettings });
      if (error) console.error("Failed to save settings to DB", error);
  };

  const handleAdminDeleteParcel = async (id: string) => {
      // Optimistic update
      setParcels(parcels.filter(p => p.id !== id));
      
      // DB Update
      const { error } = await supabase.from('parcels').delete().eq('id', id);
      if (error) {
          console.error("Erreur suppression DB", error);
          alert("Erreur lors de la suppression en base de données. Vérifiez la connexion.");
      }
  };

  const handleAdminAddParcel = async (parcel: ParcelType) => {
     // Prepare for DB (snake_case)
     const dbParcel = {
         id: parcel.id,
         site: parcel.site,
         category: parcel.category,
         area: parcel.area,
         price_per_m2: parcel.pricePerM2,
         total_price: parcel.totalPrice,
         subscription_fee: parcel.subscriptionFee,
         description: parcel.description,
         status: parcel.status,
         image_url: parcel.imageUrl
     };

     setParcels([...parcels, parcel]);
     const { error } = await supabase.from('parcels').insert([dbParcel]);
     if (error) console.error("Error adding parcel", error);
  }

  const handleAdminUpdateParcel = async (parcel: ParcelType) => {
     // Optimistic update
     setParcels(parcels.map(p => p.id === parcel.id ? parcel : p));

     const dbParcel = {
         id: parcel.id,
         site: parcel.site,
         category: parcel.category,
         area: parcel.area,
         price_per_m2: parcel.pricePerM2,
         total_price: parcel.totalPrice,
         subscription_fee: parcel.subscriptionFee,
         description: parcel.description,
         status: parcel.status,
         image_url: parcel.imageUrl
     };
     
     const { error } = await supabase.from('parcels').update(dbParcel).eq('id', parcel.id);
     if (error) console.error("Error updating parcel", error);
  };

  const handleAdminUpdateSubscription = async (id: string, status: 'VALIDATED' | 'REJECTED') => {
      // Optimistic update
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status } : s));

      const { error } = await supabase.from('subscriptions').update({ status }).eq('id', id);
      if (error) {
          console.error("Error updating subscription status", error);
          alert("Erreur lors de la mise à jour.");
      }
  };

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
      // Verifier d'abord le PIN configuré, sinon le PIN d'environnement, sinon le PIN par défaut
      const validPin = systemSettings.adminPin || (import.meta as any).env?.VITE_ADMIN_PIN || '1306';
      
      if(adminPin === validPin) {
          setIsAdminLoggedIn(true);
          // Reset pin input for security
          setAdminPin('');
      } else {
          alert('Code PIN incorrect');
      }
  };

  if (isAdminLoggedIn) {
      return (
          <AdminPanel 
            parcels={parcels}
            subscriptions={subscriptions}
            settings={systemSettings}
            onUpdateSettings={handleAdminUpdateSettings}
            onLogout={() => setIsAdminLoggedIn(false)}
            onAddParcel={handleAdminAddParcel}
            onUpdateParcel={handleAdminUpdateParcel}
            onDeleteParcel={handleAdminDeleteParcel}
            onUpdateSubscription={handleAdminUpdateSubscription} 
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
                 <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">{systemSettings.companyName}</h1>
                 <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Souscription en ligne</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <a href={`https://wa.me/${systemSettings.whatsappNumber}`} className="bg-green-100 text-green-700 p-2 rounded-full hover:bg-green-200 transition-colors">
                <MessageCircle size={20} />
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 pt-6">
        {step < SubscriptionStep.CONFIRMATION && <StepIndicator currentStep={step} />}

        <div className="mt-6">
            {step === SubscriptionStep.CONDITIONS && (
                <div className={animClass}>
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
                <div className={animClass}>
                    <StepIdentification data={userData} onChange={(k, v) => setUserData({...userData, [k]: v})} />
                    <div className="mt-6 flex justify-between">
                        <Button variant="outline" onClick={handleBack}>Retour</Button>
                        <Button 
                            onClick={handleNext} 
                            disabled={
                                !userData.fullName || 
                                !userData.phone || 
                                !userData.birthDate ||
                                !userData.birthPlace ||
                                !userData.profession ||
                                !userData.gender ||
                                !userData.idType ||
                                !userData.idNumber || 
                                !userData.idIssueDate ||
                                !userData.addressType ||
                                !userData.address ||
                                !userData.country
                            }
                            className="bg-[#009640]"
                        >
                            Suivant <ChevronRight className="ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {step === SubscriptionStep.SITE_SELECTION && (
                <div className={animClass}>
                    <StepSiteSelection 
                        selectedSites={selectedSites} 
                        onToggle={(siteId) => {
                             setSelectedSites(prev => 
                                prev.includes(siteId) 
                                   ? prev.filter(id => id !== siteId)
                                   : [...prev, siteId]
                             );
                        }} 
                    />
                    <div className="mt-6 flex justify-between">
                        <Button variant="outline" onClick={handleBack}>Retour</Button>
                        <Button 
                            onClick={handleNext} 
                            disabled={selectedSites.length === 0}
                            className="bg-[#009640]"
                        >
                            Suivant <ChevronRight className="ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {step === SubscriptionStep.PARCEL_LIST && selectedSites.length > 0 && (
                <div className={animClass}>
                    <StepParcelList 
                        parcels={parcels} 
                        sites={selectedSites}
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
                <div className={animClass}>
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
                 <div className={animClass}>
                    <StepPayment 
                        userData={userData}
                        parcel={selectedParcel}
                        settings={systemSettings}
                        onFinish={handleSubscriptionFinish}
                    />
                 </div>
            )}

            {step === SubscriptionStep.CONFIRMATION && (
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center animate-in zoom-in pt-12">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-[#009640]">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Merci pour votre souscription !</h2>
                    <p className="text-gray-600 mb-8">Votre paiement est en cours de vérification par nos services. Une fois validé, vous recevrez une confirmation.</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Retour à l'accueil
                    </Button>
                </div>
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8 px-4 text-center text-sm text-gray-600">
         <div className="max-w-2xl mx-auto space-y-4">
             <div>
                <p className="font-bold text-[#009640] text-lg">{systemSettings.companyName}</p>
                <p>{systemSettings.footerText}</p>
             </div>
             
             <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 py-4 border-t border-b border-gray-100 text-gray-500">
                <div className="flex items-center justify-center gap-2">
                    <MapPin size={16} />
                    <span>{systemSettings.contactAddress || "Adresse non définie"}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <Phone size={16} />
                    <span>{systemSettings.whatsappNumber || "N/A"}</span>
                </div>
                {systemSettings.contactEmail && (
                    <div className="flex items-center justify-center gap-2">
                        <Mail size={16} />
                        <span>{systemSettings.contactEmail}</span>
                    </div>
                )}
             </div>

             <p onClick={handleSecretAdminAccess} className="text-xs text-gray-400 cursor-default hover:text-green-600 transition-colors pt-2">
                &copy; {new Date().getFullYear()} Tous droits réservés.
             </p>
         </div>
      </footer>

      {/* Floating WhatsApp */}
      <a 
         href={`https://wa.me/${systemSettings.whatsappNumber}`}
         target="_blank"
         rel="noreferrer"
         className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-50 flex items-center justify-center hover:bg-[#128C7E]"
      >
        <MessageCircle size={28} />
      </a>

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="bg-white p-6 rounded-xl w-full max-w-xs relative animate-in zoom-in">
              <button onClick={() => setIsAdminLoginOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={20}/></button>
              <h2 className="text-center font-bold mb-4 text-[#009640]">Accès Admin</h2>
              <form onSubmit={handleAdminLogin}>
                  <input 
                    type="password" 
                    className="w-full border p-2 rounded mb-4 text-center tracking-widest text-lg" 
                    placeholder="CODE PIN" 
                    value={adminPin} 
                    onChange={e => setAdminPin(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit" className="w-full bg-[#009640]">Entrer</Button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}