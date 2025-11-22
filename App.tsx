
import React, { useState, useEffect, useRef } from 'react';
import { SubscriptionState, SubscriptionStep, UserData, ParcelType, MOCK_PARCELS, MOCK_SUBSCRIPTIONS, SONATUR_PHONE, SubscriptionRecord } from './types';
import StepIndicator from './components/StepIndicator';
import Button from './components/Button';
import AdminPanel from './components/AdminPanel';
import { CheckCircle, MapPin, User, CreditCard, FileText, Smartphone, Clock, ChevronLeft, ChevronRight, Info, Building2, Phone, ShieldCheck, Copy, Loader2, Lock, ArrowUp, ArrowDown, DollarSign, Mail, Check, X, AlertCircle, AlertTriangle, Wand2, Image as ImageIcon } from 'lucide-react';
import { supabase, safeSupabaseQuery } from './lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";

// --- Helper Components for each Step --- //

const ParcelVisualizer: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  parcel: ParcelType; 
}> = ({ isOpen, onClose, parcel }) => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGeneratedImage(null);
      setPrompt("");
      setError(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Fetch original image to get blob/base64
      // Using cross-origin fetch might be restricted depending on source, 
      // but for this demo we assume accessible URLs or handling via proxy if needed.
      // In a real prod env, this should be handled server-side or via proper CORS config.
      const imgResponse = await fetch(parcel.imageUrl);
      const blob = await imgResponse.blob();
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data:image/jpeg;base64, prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: `Modifie cette image de parcelle de terrain au Burkina Faso en suivant cette instruction : "${prompt}". Garde un style réaliste, naturel et adapté au contexte local (sahel, terre rouge, végétation locale).` },
          ],
        },
      });

      // Extract generated image
      let foundImage = false;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            setGeneratedImage(`data:image/png;base64,${base64EncodeString}`);
            foundImage = true;
            break;
          }
        }
      }
      
      if (!foundImage) {
        setError("Aucune image générée. Veuillez réessayer avec une autre description.");
      }

    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors de la génération. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Image Area */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center p-4 relative min-h-[300px]">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {isLoading ? (
               <div className="text-white flex flex-col items-center gap-3">
                 <Loader2 size={48} className="animate-spin text-green-500" />
                 <p className="animate-pulse">L'IA aménage votre parcelle...</p>
               </div>
            ) : generatedImage ? (
              <img src={generatedImage} alt="Généré" className="max-w-full max-h-full object-contain rounded shadow-lg" />
            ) : (
              <img src={parcel.imageUrl} alt="Original" className="max-w-full max-h-full object-contain rounded shadow-lg opacity-90" />
            )}
            
            {/* Toggle Original/Generated hint if generated exists */}
            {generatedImage && !isLoading && (
              <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                Résultat IA
              </div>
            )}
          </div>
        </div>

        {/* Controls Area */}
        <div className="w-full md:w-96 bg-white p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Wand2 className="text-purple-600" /> 
              Studio IA
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Votre projet d'aménagement</label>
              <p className="text-xs text-gray-500">Décrivez ce que vous souhaitez voir sur cette parcelle (ex: villa, jardin, clôture...)</p>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Ajoute une petite villa moderne avec un toit en tuiles et quelques manguiers autour."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none h-32 resize-none text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
              <p className="flex gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                L'intelligence artificielle générera une prévisualisation réaliste basée sur votre description.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
             <Button 
               onClick={handleGenerate} 
               disabled={isLoading || !prompt.trim()}
               className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 flex justify-center items-center gap-2"
             >
               {isLoading ? 'Génération en cours...' : <><Wand2 size={18} /> Générer l'aperçu</>}
             </Button>
             {generatedImage && (
                <Button 
                  variant="outline" 
                  onClick={() => setGeneratedImage(null)}
                  className="w-full"
                >
                  Réinitialiser l'image
                </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StepConditions: React.FC<{ accepted: boolean; onToggle: () => void }> = ({ accepted, onToggle }) => (
  <div className="space-y-4">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4 text-green-700 font-bold text-lg border-b pb-2">
        <FileText size={24} />
        Conditions Générales de Souscription
      </div>
      <div className="prose prose-sm text-gray-600 max-h-64 overflow-y-auto mb-6 bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
        <p className="font-bold mb-2">La SONATUR met à disposition des parcelles dans le cadre d’opérations foncières planifiées.</p>
        <p className="mb-2">Toute souscription en ligne implique l’acceptation des conditions suivantes :</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Le souscripteur certifie l’exactitude des informations transmises.</li>
          <li>Les paiements doivent être effectués uniquement par les canaux officiels (Orange Money ou guichet SONATUR).</li>
          <li>La SONATUR se réserve le droit de valider ou de rejeter toute demande de souscription.</li>
          <li>Aucun remboursement n’est effectué après validation du paiement sauf cas de force majeure avéré.</li>
          <li>La confirmation de souscription se fait par un message WhatsApp officiel au numéro SONATUR.</li>
        </ol>
      </div>
      <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
        <input 
          type="checkbox" 
          checked={accepted} 
          onChange={onToggle}
          className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded" 
        />
        <span className="text-gray-700 font-medium select-none">J'ai lu et j'accepte les conditions de l'opération</span>
      </label>
    </div>
  </div>
);

const StepIdentification: React.FC<{ data: UserData; onChange: (field: keyof UserData, value: string) => void }> = ({ data, onChange }) => {
  const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition";
  
  return (
    <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <User className="text-green-600" /> Informations Personnelles
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
          <input 
            type="text" 
            value={data.fullName} 
            onChange={(e) => onChange('fullName', e.target.value)} 
            className={inputClass}
            placeholder="Ex: OUEDRAOGO Jean"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
          <input 
            type="tel" 
            value={data.phone} 
            onChange={(e) => onChange('phone', e.target.value)} 
            className={inputClass}
            placeholder="Ex: 70000000"
          />
        </div>
        
        {/* Nouveau champ Email (à côté du téléphone dans la grille responsive) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (Facultatif)</label>
          <div className="relative">
            <input 
                type="email" 
                value={data.email || ''} 
                onChange={(e) => onChange('email', e.target.value)} 
                className={`${inputClass} pl-10`}
                placeholder="Ex: jean@example.bf"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
          <input 
            type="date" 
            value={data.birthDate} 
            onChange={(e) => onChange('birthDate', e.target.value)} 
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance *</label>
          <input 
            type="text" 
            value={data.birthPlace} 
            onChange={(e) => onChange('birthPlace', e.target.value)} 
            className={inputClass}
            placeholder="Ville de naissance"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profession *</label>
          <input 
            type="text" 
            value={data.profession} 
            onChange={(e) => onChange('profession', e.target.value)} 
            className={inputClass}
            placeholder="Votre profession"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
          <select 
            value={data.gender} 
            onChange={(e) => onChange('gender', e.target.value)} 
            className={inputClass}
          >
            <option value="">Sélectionner</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mt-6 mb-4">
        <CreditCard className="text-green-600" /> Pièce d'identité
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de document *</label>
          <select 
            value={data.idType} 
            onChange={(e) => onChange('idType', e.target.value)} 
            className={inputClass}
          >
            <option value="">Sélectionner</option>
            <option value="CNIB">Carte Nationale d'Identité (CNIB)</option>
            <option value="Passeport">Passeport</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de pièce *</label>
          <input 
            type="text" 
            value={data.idNumber} 
            onChange={(e) => onChange('idNumber', e.target.value)} 
            className={inputClass}
            placeholder="Numéro du document"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date d'émission de la pièce *</label>
          <input 
            type="date" 
            value={data.idIssueDate} 
            onChange={(e) => onChange('idIssueDate', e.target.value)} 
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'émission de la pièce *</label>
          <input 
            type="text" 
            value={data.idIssuePlace} 
            onChange={(e) => onChange('idIssuePlace', e.target.value)} 
            className={inputClass}
            placeholder="Ville d'émission"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ville de résidence *</label>
          <input 
            type="text" 
            value={data.city} 
            onChange={(e) => onChange('city', e.target.value)} 
            className={inputClass}
            placeholder="Ouagadougou"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
          <textarea 
            value={data.address} 
            onChange={(e) => onChange('address', e.target.value)} 
            className={inputClass}
            placeholder="Quartier, Secteur, Rue, Porte..."
            rows={3}
          />
        </div>
      </div>
      <p className="text-xs text-red-500 italic mt-4">* Tous les champs sont obligatoires (sauf Email)</p>
    </div>
  );
};

const StepProgram: React.FC<{ selected: string | null; onSelect: (id: string) => void }> = ({ selected, onSelect }) => (
  <div className="grid grid-cols-1 gap-4">
    <h2 className="text-lg font-semibold text-gray-700 mb-2">Opérations en cours</h2>
    <div 
      onClick={() => onSelect("ZINIARE_SILMIOUGOU")}
      className={`cursor-pointer border-2 rounded-xl p-6 transition-all flex items-start gap-4 relative
        ${selected === "ZINIARE_SILMIOUGOU" ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-green-300'}`}
    >
      <div className={`p-3 rounded-full ${selected === "ZINIARE_SILMIOUGOU" ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
        <MapPin size={24} />
      </div>
      <div>
        <h3 className="font-bold text-lg text-gray-800">Vente de parcelles - Ziniaré</h3>
        <p className="text-gray-600">Localité : Silmiougou</p>
        <p className="text-sm text-gray-500 mt-2">Zone à fort potentiel d'aménagement. Idéal pour habitation et commerce.</p>
      </div>
      {selected === "ZINIARE_SILMIOUGOU" && (
        <div className="absolute top-4 right-4 text-green-600">
          <CheckCircle size={24} />
        </div>
      )}
    </div>
  </div>
);

const StepParcel: React.FC<{ 
  parcels: ParcelType[];
  selected: ParcelType | null; 
  onSelect: (parcel: ParcelType) => void 
}> = ({ parcels, selected, onSelect }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [visualizerParcel, setVisualizerParcel] = useState<ParcelType | null>(null);

  const sortedParcels = [...parcels].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.totalPrice - b.totalPrice;
    } else {
      return b.totalPrice - a.totalPrice;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Sélectionnez une parcelle</h2>
        
        {/* Sort Controls */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setSortOrder('asc')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition duration-200
              ${sortOrder === 'asc' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ArrowUp size={14} />
            <span>Prix Croissant</span>
          </button>
          <div className="w-px h-4 bg-gray-200"></div>
          <button
            onClick={() => setSortOrder('desc')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition duration-200
              ${sortOrder === 'desc' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ArrowDown size={14} />
            <span>Prix Décroissant</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedParcels.map((parcel) => {
          const isSelected = selected?.id === parcel.id;
          const isUnavailable = parcel.status !== 'AVAILABLE';
          
          return (
            <div 
              key={parcel.id}
              onClick={() => !isUnavailable && onSelect(parcel)}
              className={`cursor-pointer border rounded-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative group flex flex-col md:flex-row
                ${isUnavailable ? 'opacity-60 grayscale bg-gray-50 cursor-not-allowed' : ''}
                ${isSelected 
                  ? 'border-2 border-green-600 bg-green-50 shadow-lg ring-1 ring-green-500 transform scale-[1.02] z-10' 
                  : !isUnavailable ? 'border-gray-200 bg-white hover:shadow-md hover:border-green-300 hover:bg-gray-50' : 'border-gray-200 bg-gray-50'}`}
            >
              {/* Image Section */}
              <div className="w-full md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                 <img 
                   src={parcel.imageUrl} 
                   alt={`Parcelle ${parcel.id}`} 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r"></div>
                 
                 {/* Category Badge */}
                 <div className="absolute top-3 left-3">
                    <span className={`inline-block px-2 py-1 text-xs font-bold rounded-md backdrop-blur-md shadow-sm
                        ${isSelected ? 'bg-green-600 text-white' : 'bg-white/90 text-gray-800'}`}>
                        {parcel.category}
                    </span>
                 </div>

                 {/* Status Badge */}
                 {isUnavailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                       <span className="px-4 py-2 text-sm font-bold rounded-md bg-red-600 text-white transform -rotate-12 shadow-lg border-2 border-white">
                          {parcel.status === 'SOLD' ? 'VENDU' : 'RÉSERVÉ'}
                       </span>
                    </div>
                 )}

                 {/* Selected Indicator */}
                 {!isUnavailable && isSelected && (
                     <div className="absolute bottom-3 right-3 bg-green-600 text-white rounded-full p-1.5 shadow-lg animate-in zoom-in">
                         <CheckCircle size={20} strokeWidth={3} />
                     </div>
                 )}
              </div>

              {/* Content Section */}
              <div className="p-5 flex flex-col justify-between w-full md:w-2/3">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className={`text-xl font-bold transition-colors duration-300 ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                            {parcel.totalPrice.toLocaleString('fr-FR')} FCFA
                        </h4>
                        <span className="font-mono text-xs text-gray-400">{parcel.id}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <div className="flex items-center gap-4">
                            <p className="flex items-center gap-1"><ImageIcon size={14}/> {parcel.area} m²</p>
                            <p className="flex items-center gap-1"><DollarSign size={14}/> {parcel.pricePerM2.toLocaleString()} /m²</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{parcel.description}</p>
                    </div>
                </div>

                <div className="mt-4 flex gap-3">
                    {!isUnavailable && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setVisualizerParcel(parcel);
                            }}
                            className="flex-1 py-2 px-3 rounded-lg font-medium text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 hover:border-purple-300"
                        >
                            <Wand2 size={14} />
                            Simuler un aménagement
                        </button>
                    )}
                    
                    {!isUnavailable && (
                        <button className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-2
                        ${isSelected ? 'bg-green-600 text-white shadow-md' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                        {isSelected ? 'Sélectionné' : 'Choisir cette parcelle'}
                        </button>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Visualizer Modal */}
      {visualizerParcel && (
        <ParcelVisualizer 
            isOpen={true} 
            onClose={() => setVisualizerParcel(null)} 
            parcel={visualizerParcel} 
        />
      )}
    </div>
  );
};

const StepPayment: React.FC<{ 
  userData: UserData; 
  parcel: ParcelType; 
  method: string | null; 
  setMethod: (m: 'ORANGE_MONEY' | 'MOOV_MONEY') => void;
  paymentStatus: 'PENDING' | 'COMPLETED';
  onPaymentComplete: () => void;
}> = ({ userData, parcel, method, setMethod, paymentStatus, onPaymentComplete }) => {
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [transactionInput, setTransactionInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

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

  // Ouvrir la modale de confirmation au lieu de payer direct
  const handleVerifyClick = () => {
    if (!transactionInput || !userConfirmed) return;
    setShowConfirmationModal(true);
  };

  // Le vrai processus de paiement qui se lance après confirmation dans la modale
  const processPayment = () => {
    setShowConfirmationModal(false);
    setIsVerifying(true);
    // Simulate API Call
    setTimeout(() => {
      setIsVerifying(false);
      onPaymentComplete();
    }, 2000);
  };

  const handleDemoSimulate = () => {
    const mockId = "CI-" + Math.floor(Math.random() * 10000000);
    setTransactionInput(mockId);
    setUserConfirmed(true);
  }

  // Payment Steps Visual Logic
  const steps = [
    { id: 1, label: 'Choix du moyen' },
    { id: 2, label: 'Paiement Mobile' },
    { id: 3, label: 'Validation' }
  ];
  
  let activeStep = 1;
  if (method) activeStep = 2;
  if (paymentStatus === 'COMPLETED') activeStep = 3;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10"></div>
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center bg-white px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors duration-300 border-2
              ${activeStep >= s.id ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              {activeStep > s.id ? <Check size={16} /> : s.id}
            </div>
            <span className={`text-xs mt-1 font-medium ${activeStep >= s.id ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {!method ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setMethod('ORANGE_MONEY')}
            className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition group"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <Smartphone size={32} />
            </div>
            <span className="font-bold text-gray-800">Orange Money</span>
            <span className="text-xs text-gray-500 mt-1">Paiement instantané</span>
          </button>

          <button 
            onClick={() => setMethod('MOOV_MONEY')}
            className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <Smartphone size={32} />
            </div>
            <span className="font-bold text-gray-800">Moov Money</span>
            <span className="text-xs text-gray-500 mt-1">Paiement instantané</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
            <button onClick={() => setMethod(null as any)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
              <ChevronLeft size={16} /> Changer
            </button>
            <div className="flex items-center gap-2 text-red-600 font-mono font-bold bg-red-50 px-3 py-1 rounded-lg">
              <Clock size={16} /> {formatTime(timeLeft)}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center mb-6">
               <p className="text-gray-500 text-sm mb-1">Montant à payer</p>
               <p className="text-3xl font-bold text-green-700">{parcel.subscriptionFee.toLocaleString()} FCFA</p>
               <p className="text-xs text-gray-400 mt-2">Frais de dossier non remboursables</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Info size={18} /> Instructions de paiement
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
                <li>Composez le <strong>*144*10*...#</strong> sur votre téléphone.</li>
                <li>Entrez le code marchand : <strong className="font-mono">056732</strong></li>
                <li>Entrez le montant exact : <strong>{parcel.subscriptionFee}</strong></li>
                <li>Validez avec votre code PIN.</li>
                <li>Vous recevrez un SMS avec l'ID de transaction.</li>
              </ol>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID de Transaction (Reçu par SMS)</label>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={transactionInput}
                        onChange={(e) => setTransactionInput(e.target.value)}
                        placeholder="Ex: CI-230109-1455"
                        className="flex-1 p-3 border border-gray-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-green-500 outline-none"
                     />
                     <button 
                        onClick={handleDemoSimulate} 
                        className="px-3 text-xs bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                        title="Simuler la réception d'un SMS"
                     >
                        Simuler
                     </button>
                  </div>
               </div>

               <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={userConfirmed} 
                    onChange={(e) => setUserConfirmed(e.target.checked)}
                    className="h-5 w-5 text-green-600 rounded focus:ring-green-500" 
                  />
                  <span className="text-sm text-gray-700">Je confirme avoir effectué le transfert du montant exact.</span>
               </label>

               <Button 
                  onClick={handleVerifyClick} 
                  isLoading={isVerifying} 
                  disabled={!transactionInput || !userConfirmed}
                  className="w-full"
               >
                  Vérifier le paiement
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-yellow-50 p-6 border-b border-yellow-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirmation Finale</h3>
              <p className="text-sm text-gray-600 mt-1">Veuillez vérifier attentivement les détails avant de valider.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                   <span className="text-gray-500">Souscripteur</span>
                   <span className="font-bold text-gray-800 text-right">{userData.fullName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                   <span className="text-gray-500">Parcelle sélectionnée</span>
                   <span className="font-bold text-gray-800 font-mono text-right">{parcel.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                   <span className="text-gray-500">Montant Payé</span>
                   <span className="font-bold text-green-700 text-right text-lg">{parcel.subscriptionFee.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between py-2">
                   <span className="text-gray-500">ID Transaction</span>
                   <span className="font-bold text-gray-800 font-mono text-right">{transactionInput}</span>
                </div>
              </div>

              <p className="text-xs text-center text-gray-500 italic bg-gray-50 p-3 rounded">
                En cliquant sur "Confirmer", vous certifiez l'exactitude des informations. Cette action est irréversible.
              </p>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3">
               <Button 
                 variant="outline" 
                 onClick={() => setShowConfirmationModal(false)}
                 className="flex-1"
               >
                 Annuler
               </Button>
               <Button 
                 variant="primary" 
                 onClick={processPayment}
                 className="flex-1"
               >
                 Confirmer et Payer
               </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// --- Main App Component --- //

export default function App() {
  const [step, setStep] = useState<SubscriptionStep>(SubscriptionStep.CONDITIONS);
  const [conditionsAccepted, setConditionsAccepted] = useState(false);
  
  const [userData, setUserData] = useState<UserData>({
    fullName: '', phone: '', email: '', birthDate: '', birthPlace: '',
    profession: '', gender: '', idType: '', idNumber: '',
    idIssueDate: '', idIssuePlace: '', address: '', city: ''
  });

  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ORANGE_MONEY' | 'MOOV_MONEY' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Data from Supabase or Mock
  const [parcels, setParcels] = useState<ParcelType[]>(MOCK_PARCELS);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(MOCK_SUBSCRIPTIONS);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState<string | null>(null);

  // --- Supabase Data Loading ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      // 1. Load Parcels
      const { data: parcelsData, error: parcelsError } = await safeSupabaseQuery(
        supabase.from('parcels').select('*')
      );
      if (parcelsData && Array.isArray(parcelsData) && parcelsData.length > 0) {
        setParcels(parcelsData as unknown as ParcelType[]);
      } else if (parcelsError) {
        // If error or empty, keep mocks (or handle error UI)
        console.warn("Using mock parcels due to DB error or empty table:", parcelsError);
      }
      
      setIsLoadingData(false);
    };

    loadData();
  }, []);

  // Load Subscriptions only when Admin logs in
  useEffect(() => {
    if (isAdminLoggedIn) {
       const fetchSubs = async () => {
          const { data, error } = await safeSupabaseQuery(
             supabase.from('subscriptions').select('*').order('date', { ascending: false })
          );
          if (data) setSubscriptions(data as unknown as SubscriptionRecord[]);
       };
       fetchSubs();
    }
  }, [isAdminLoggedIn]);

  // --- Navigation Handlers ---
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handlePaymentComplete = async () => {
    setPaymentStatus('COMPLETED');
    
    // Create Subscription Record
    const newSub: SubscriptionRecord = {
        id: "SUB-" + Date.now().toString().slice(-6),
        date: new Date().toISOString(),
        userData: userData,
        parcelId: selectedParcel!.id,
        status: 'PENDING',
        paymentMethod: paymentMethod!,
        history: [{
            status: 'PENDING',
            date: new Date().toISOString(),
            updatedBy: 'SYSTEM',
            comment: 'Souscription initiale'
        }]
    };

    // Save to Supabase
    const { error } = await safeSupabaseQuery(
        supabase.from('subscriptions').insert([newSub])
    );

    if (error) {
        alert("Erreur lors de la sauvegarde: " + error);
    } else {
        setSubscriptions(prev => [newSub, ...prev]);
    }

    // Update Parcel Status to RESERVED
    if (selectedParcel) {
        const { error: parcelError } = await safeSupabaseQuery(
             supabase.from('parcels').update({ status: 'RESERVED' }).eq('id', selectedParcel.id)
        );
        if (!parcelError) {
            setParcels(prev => prev.map(p => p.id === selectedParcel.id ? { ...p, status: 'RESERVED' } : p));
        }
    }

    setTimeout(() => nextStep(), 500);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '1306') {
      setIsAdminLoggedIn(true);
      setIsAdminLoginOpen(false);
      setAdminPin('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setStep(SubscriptionStep.CONDITIONS);
  };

  // --- Secret Admin Access Logic ---
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const handleSecretAdminAccess = () => {
    const now = Date.now();
    // Reset if more than 1 second has passed since last click
    if (now - lastClickTimeRef.current > 1000) {
      clickCountRef.current = 0;
    }
    
    clickCountRef.current += 1;
    lastClickTimeRef.current = now;

    // Trigger after 7 rapid clicks
    if (clickCountRef.current >= 7) {
      setIsAdminLoginOpen(true);
      clickCountRef.current = 0;
    }
  };

  // --- Render --- //

  if (isAdminLoggedIn) {
    return (
      <AdminPanel 
        parcels={parcels}
        subscriptions={subscriptions}
        onLogout={handleLogout}
        lastEmailSent={lastEmailSent}
        onUpdateParcel={async (updatedParcel) => {
            // Optimistic UI Update
            setParcels(prev => prev.map(p => p.id === updatedParcel.id ? updatedParcel : p));
            // DB Update
            await safeSupabaseQuery(supabase.from('parcels').update(updatedParcel).eq('id', updatedParcel.id));
        }}
        onAddParcel={async (newParcel) => {
            setParcels(prev => [...prev, newParcel]);
            await safeSupabaseQuery(supabase.from('parcels').insert([newParcel]));
        }}
        onDeleteParcel={async (id) => {
            // UI Update
            setParcels(prev => prev.filter(p => p.id !== id));
            // DB Update
            const { error } = await safeSupabaseQuery(supabase.from('parcels').delete().eq('id', id));
            if (error) {
               alert("Erreur lors de la suppression. Vérifiez que la parcelle n'est pas liée à une souscription.");
               // Rollback logic would go here ideally, or simple reload
               window.location.reload();
            }
        }}
        onUpdateSubscription={async (id, status) => {
            const timestamp = new Date().toISOString();
            // Update Local State
            setSubscriptions(prev => prev.map(sub => {
                if (sub.id === id) {
                    return {
                        ...sub,
                        status,
                        history: [...sub.history, { 
                            status, 
                            date: timestamp, 
                            updatedBy: 'ADMIN', 
                            comment: status === 'VALIDATED' ? 'Dossier validé' : 'Dossier rejeté' 
                        }]
                    };
                }
                return sub;
            }));

            // Update DB
            const subToUpdate = subscriptions.find(s => s.id === id);
            if(subToUpdate) {
                 const newHistory = [...subToUpdate.history, { 
                    status, 
                    date: timestamp, 
                    updatedBy: 'ADMIN', 
                    comment: status === 'VALIDATED' ? 'Dossier validé' : 'Dossier rejeté' 
                }];
                
                await safeSupabaseQuery(
                    supabase.from('subscriptions').update({ status, history: newHistory }).eq('id', id)
                );

                // Send Email Notification Logic (Simulated)
                if (status === 'VALIDATED') {
                    setLastEmailSent(`Confirmation envoyée à ${subToUpdate.userData.fullName}`);
                }
            }
        }}
      />
    );
  }

  // Environment Variable for Project Name (fallback to SONATUR)
  const projectName = (import.meta as any).env?.VITE_PROJECT_NAME || "SONATUR";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold shadow-green-200 shadow-lg">
              <Building2 size={24} />
            </div>
            <div>
               <h1 className="text-xl font-bold text-gray-900 leading-tight">{projectName}</h1>
               <p className="text-xs text-gray-500 font-medium">Portail Officiel de Souscription</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
             <span className="flex items-center gap-1.5"><Phone size={16} className="text-green-600"/> {SONATUR_PHONE}</span>
             <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-green-600"/> Sécurisé</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-6 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          
          {/* Step Indicator */}
          {step < SubscriptionStep.CONFIRMATION && <StepIndicator currentStep={step} />}

          {/* Dynamic Content Area */}
          <div className="transition-all duration-300 ease-in-out">
            {step === SubscriptionStep.CONDITIONS && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StepConditions 
                  accepted={conditionsAccepted} 
                  onToggle={() => setConditionsAccepted(!conditionsAccepted)} 
                />
                <div className="mt-6 flex justify-end">
                  <Button onClick={nextStep} disabled={!conditionsAccepted}>
                    Commencer la souscription <ChevronRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === SubscriptionStep.IDENTIFICATION && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StepIdentification 
                  data={userData} 
                  onChange={(field, value) => setUserData(prev => ({ ...prev, [field]: value }))} 
                />
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>Retour</Button>
                  <Button onClick={nextStep} disabled={!userData.fullName || !userData.phone}>
                    Suivant <ChevronRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === SubscriptionStep.PROGRAM && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StepProgram 
                  selected={selectedProgram} 
                  onSelect={setSelectedProgram} 
                />
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>Retour</Button>
                  <Button onClick={nextStep} disabled={!selectedProgram}>
                    Suivant <ChevronRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === SubscriptionStep.PARCEL && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isLoadingData ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Loader2 size={48} className="animate-spin mb-4 text-green-600" />
                        <p>Chargement des parcelles...</p>
                    </div>
                ) : (
                    <StepParcel 
                    parcels={parcels}
                    selected={selectedParcel} 
                    onSelect={setSelectedParcel} 
                    />
                )}
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>Retour</Button>
                  <Button onClick={nextStep} disabled={!selectedParcel}>
                    Suivant <ChevronRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === SubscriptionStep.PAYMENT && selectedParcel && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StepPayment 
                  userData={userData} 
                  parcel={selectedParcel}
                  method={paymentMethod}
                  setMethod={setPaymentMethod}
                  paymentStatus={paymentStatus}
                  onPaymentComplete={handlePaymentComplete}
                />
                <div className="mt-6 flex justify-start">
                   {paymentStatus !== 'COMPLETED' && <Button variant="outline" onClick={prevStep}>Retour</Button>}
                </div>
              </div>
            )}

            {step === SubscriptionStep.CONFIRMATION && selectedParcel && (
               <div className="bg-white p-8 rounded-2xl shadow-lg text-center animate-in zoom-in duration-500 border-t-4 border-green-500">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                      <CheckCircle size={48} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Félicitations !</h2>
                  <p className="text-lg text-gray-600 mb-8">Votre souscription a été enregistrée avec succès.</p>
                  
                  <div className="bg-gray-50 p-6 rounded-xl text-left mb-8 max-w-md mx-auto border border-gray-100">
                      <div className="grid grid-cols-2 gap-y-4 text-sm">
                          <span className="text-gray-500">Référence Dossier</span>
                          <span className="font-bold font-mono text-right">{subscriptions[0]?.id || "SUB-PENDING"}</span>
                          
                          <span className="text-gray-500">Parcelle</span>
                          <span className="font-bold text-right">{selectedParcel.id}</span>
                          
                          <span className="text-gray-500">Montant payé</span>
                          <span className="font-bold text-right text-green-700">{selectedParcel.subscriptionFee.toLocaleString()} FCFA</span>
                      </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full justify-center" onClick={() => window.location.reload()}>
                        Nouvelle souscription
                    </Button>
                    <p className="text-xs text-gray-400 mt-4">Un récapitulatif a été envoyé par SMS au {userData.phone}</p>
                  </div>
               </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Building2 size={20}/> SONATUR</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Société Nationale d'Aménagement des Terrains Urbains. Votre partenaire de confiance pour l'accès au foncier sécurisé.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>Siège : 03 BP 7026 Ouagadougou 03</li>
                <li>Tél : (+226) 25 30 17 73</li>
                <li>Email : info@sonatur.bf</li>
              </ul>
            </div>
            <div>
               <h3 className="font-bold text-lg mb-4">Besoin d'aide ?</h3>
               <a 
                 href={`https://wa.me/${SONATUR_PHONE}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition-colors"
               >
                  <MessageCircleIcon size={18} /> Support WhatsApp
               </a>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm flex justify-center">
            <p 
              onClick={handleSecretAdminAccess}
              className="cursor-default select-none active:text-slate-400 transition-colors"
              title="Copyright"
            >
              &copy; {new Date().getFullYear()} SONATUR. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button 
              onClick={() => { setIsAdminLoginOpen(false); setPinError(false); setAdminPin(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Accès Administrateur</h2>
              <p className="text-gray-500 text-sm">Veuillez saisir votre code PIN sécurisé</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <input 
                  type="password" 
                  value={adminPin}
                  onChange={(e) => { setAdminPin(e.target.value); setPinError(false); }}
                  className={`w-full text-center text-3xl tracking-[0.5em] font-bold py-4 border-b-2 focus:outline-none transition-colors
                    ${pinError ? 'border-red-500 text-red-600' : 'border-gray-300 focus:border-slate-900 text-gray-800'}`}
                  placeholder="••••"
                  maxLength={4}
                  autoFocus
                />
                {pinError && (
                  <p className="text-red-500 text-xs text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle size={12} /> Code PIN incorrect
                  </p>
                )}
              </div>
              
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">
                Connexion
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Icon Component for Footer
const MessageCircleIcon = ({ size }: { size: number }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
);
