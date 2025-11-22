
import React, { useState, useEffect, useRef } from 'react';
import { SubscriptionState, SubscriptionStep, UserData, ParcelType, MOCK_PARCELS, MOCK_SUBSCRIPTIONS, SONATUR_PHONE, SubscriptionRecord, COUNTRIES_WEST_CENTRAL_AFRICA } from './types';
import StepIndicator from './components/StepIndicator';
import Button from './components/Button';
import AdminPanel from './components/AdminPanel';
import { CheckCircle, MapPin, User, CreditCard, FileText, Smartphone, Clock, ChevronLeft, ChevronRight, Info, Building2, Phone, ShieldCheck, Copy, Loader2, Lock, ArrowUp, ArrowDown, DollarSign, Mail, Check, X, AlertCircle, AlertTriangle, MessageCircle } from 'lucide-react';
import { supabase, safeSupabaseQuery } from './lib/supabaseClient';

// --- Helper Components for each Step --- //

const StepConditions: React.FC<{ accepted: boolean; onToggle: () => void }> = ({ accepted, onToggle }) => (
  <div className="space-y-4">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4 text-green-700 font-bold text-lg border-b pb-2">
        <FileText size={24} />
        Conditions de participation
      </div>
      <div className="prose prose-sm text-gray-700 max-h-[60vh] overflow-y-auto mb-6 bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
        <h4 className="font-bold text-gray-900 mb-2">Conditions de participation à l'acquisition d'une parcelle :</h4>
        <ol className="list-decimal pl-5 space-y-2 mb-4">
            <li>Toute souscription donne automatiquement droit à l'attribution d'une parcelle.</li>
            <li>Pour confirmer votre intérêt et sécuriser votre parcelle, vous devez procéder au paiement des frais de réservation pour la parcelle désirée.</li>
            <li>Les montants des frais de réservation à régler sont définis comme suit :
                <ul className="list-disc pl-5 mt-1">
                    <li>10 % du prix total pour une parcelle à usage d'habitation ;</li>
                    <li>20 % du prix total pour une parcelle à usage commercial.</li>
                </ul>
            </li>
            <li>Un reçu officiel vous sera délivré après paiement. Ce document devra être présenté lors du dépôt physique de votre dossier.</li>
            <li>Le solde restant du prix total de la parcelle devra être réglé dans un délai de douze (12) mois à compter de la date de vente. Le paiement peut s'effectuer par tranches.</li>
            <li>Vous disposez d'un délai de cinq (5) jours à compter de la date de votre souscription pour effectuer le paiement des frais de réservation. Passé ce délai :
                <ul className="list-disc pl-5 mt-1">
                    <li>La souscription sera automatiquement annulée ;</li>
                    <li>Une pénalité sera appliquée avant tout remboursement éventuel des frais engagés.</li>
                </ul>
            </li>
        </ol>

        <h4 className="font-bold text-gray-900 mb-2">Méthode de souscription</h4>
        <p className="mb-4">La vente des parcelles se fera par ordre d'arrivée et ce, dans la limite du stock disponible.</p>

        <h4 className="font-bold text-gray-900 mb-2">Documents requis</h4>
        <p className="mb-2">Pièces à fournir au plus tard le 01/01/2026 :</p>
        <ul className="list-disc pl-5 space-y-1">
            <li>Le récépissé de souscription</li>
            <li>L'original et une copie du reçu fournis par notre service technique en ligne</li>
            <li>Trois (03) photocopies légalisées de la carte nationale d'identité ou du passeport en cours de validité (personne physique) ou de l'acte de naissance (enfant mineur), des Statuts et du RCCM (personne morale)</li>
            <li>Un timbre fiscal de cinq cent (500) francs CFA</li>
        </ul>
      </div>
      
      <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg bg-green-50 border border-green-100 hover:bg-green-100 transition">
        <input 
          type="checkbox" 
          checked={accepted} 
          onChange={onToggle}
          className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded" 
        />
        <span className="text-gray-800 font-bold select-none">J'ai lu et j'accepte les conditions de l'opération</span>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Pays d'origine *</label>
          <select 
            value={data.country} 
            onChange={(e) => onChange('country', e.target.value)} 
            className={inputClass}
          >
            <option value="">Sélectionner un pays</option>
            {COUNTRIES_WEST_CENTRAL_AFRICA.map(country => (
                <option key={country} value={country}>{country}</option>
            ))}
            <option value="Autre">Autre</option>
          </select>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
          <select 
            value={data.gender} 
            onChange={(e) => onChange('gender', e.target.value)} 
            className={inputClass}
          >
            <option value="">Sélectionner</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
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
            <option value="Permis de conduire">Permis de conduire</option>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de délivrance *</label>
          <input 
            type="date" 
            value={data.idIssueDate} 
            onChange={(e) => onChange('idIssueDate', e.target.value)} 
            className={inputClass}
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
      </div>
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

      <div className="grid grid-cols-1 gap-4">
        {sortedParcels.map((parcel) => {
          const isSelected = selected?.id === parcel.id;
          const isUnavailable = parcel.status !== 'AVAILABLE';
          
          return (
            <div 
              key={parcel.id}
              onClick={() => !isUnavailable && onSelect(parcel)}
              className={`cursor-pointer border rounded-xl p-5 transition-all duration-300 relative group overflow-hidden
                ${isUnavailable ? 'opacity-60 grayscale bg-gray-50 cursor-not-allowed' : ''}
                ${isSelected 
                  ? 'border-2 border-green-600 bg-green-50 shadow-lg ring-1 ring-green-500 z-10' 
                  : !isUnavailable ? 'border-gray-200 bg-white hover:shadow-md hover:border-green-300' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span className={`inline-block px-2 py-1 text-xs font-bold rounded-md transition-colors duration-300
                      ${isSelected ? 'bg-green-200 text-green-800' : 'bg-blue-100 text-blue-700'}`}>
                      {parcel.category}
                  </span>
                  {isUnavailable && (
                      <span className="inline-block px-2 py-1 text-xs font-bold rounded-md bg-red-100 text-red-800">
                          {parcel.status === 'SOLD' ? 'VENDU' : 'RÉSERVÉ'}
                      </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">{parcel.id}</span>
                  {/* Animated Check Icon */}
                  {isSelected && !isUnavailable && (
                      <div className="bg-green-600 text-white rounded-full p-1 shadow-sm">
                          <CheckCircle size={14} strokeWidth={3} />
                      </div>
                  )}
                </div>
              </div>
              
              <h4 className={`text-xl font-bold mb-1 transition-colors duration-300 ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                {parcel.totalPrice.toLocaleString('fr-FR')} FCFA
              </h4>
              
              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p>Surface: <span className="font-semibold text-gray-800">{parcel.area} m²</span></p>
                <p>Prix/m²: {parcel.pricePerM2.toLocaleString('fr-FR')} FCFA</p>
              </div>
              
              {/* Render HTML description safely or as text */}
              <div className="text-xs text-gray-500 border-t pt-2 mt-2" dangerouslySetInnerHTML={{__html: parcel.description}}></div>

              {!isUnavailable && (
                  <div className={`w-full mt-4 py-2 rounded-lg font-medium text-sm text-center transition-all duration-300
                  ${isSelected ? 'bg-green-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                    {isSelected ? 'Sélectionné' : 'Choisir cette parcelle'}
                  </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StepRecap: React.FC<{
    userData: UserData;
    parcel: ParcelType;
    programName: string;
}> = ({ userData, parcel, programName }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-4">
                <FileText className="text-green-600" />
                Récapitulatif de la souscription
            </h2>

            <div className="space-y-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-3 uppercase text-xs">Informations Souscripteur</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-500">Nom Complet:</span>
                        <span className="font-bold text-right text-gray-900">{userData.fullName}</span>
                        
                        <span className="text-gray-500">Téléphone:</span>
                        <span className="font-bold text-right text-gray-900">{userData.phone}</span>
                        
                        <span className="text-gray-500">Document:</span>
                        <span className="font-bold text-right text-gray-900">{userData.idType} - {userData.idNumber}</span>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-3 uppercase text-xs">Détails de la Parcelle</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-500">Programme:</span>
                        <span className="font-bold text-right text-gray-900">Vente de parcelles - Ziniaré</span>
                        
                        <span className="text-gray-500">ID Parcelle:</span>
                        <span className="font-bold text-right text-gray-900 font-mono">{parcel.id}</span>
                        
                        <span className="text-gray-500">Catégorie:</span>
                        <span className="font-bold text-right text-gray-900">{parcel.category}</span>
                        
                        <span className="text-gray-500">Surface:</span>
                        <span className="font-bold text-right text-gray-900">{parcel.area} m²</span>
                        
                        <span className="text-gray-500 pt-2 border-t border-gray-200 mt-2">Frais de réservation:</span>
                        <span className="font-bold text-right text-green-700 text-lg pt-2 border-t border-gray-200 mt-2">
                            {parcel.subscriptionFee.toLocaleString()} FCFA
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepPayment: React.FC<{ 
  userData: UserData; 
  parcel: ParcelType; 
  method: string | null; 
  setMethod: (m: 'ORANGE_MONEY' | 'MOOV_MONEY') => void;
  onPaymentStart: () => void;
}> = ({ userData, parcel, method, setMethod, onPaymentStart }) => {
  const [timeLeft, setTimeLeft] = useState(20 * 60);

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

  const generateWhatsAppLink = () => {
      const message = `Bonjour, j'ai effectué le paiement pour ma souscription.
Informations de souscription:
- Nom: ${userData.fullName}
- Téléphone: ${userData.phone}
- Site: Vente de parcelles - Ziniaré
- Parcelle: ${parcel.id}
- Réseau: ${method === 'ORANGE_MONEY' ? 'ORANGE Money' : 'MOOV Money'}

Je confirme avoir effectué le paiement de ma souscription SONATUR et j’envoie la capture du SMS de validation.`;
      
      return `https://wa.me/${SONATUR_PHONE}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      {/* Timer Alert */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
          <div className="bg-yellow-100 p-2 rounded-full text-yellow-700 shrink-0">
              <Clock size={24} className="animate-pulse" />
          </div>
          <div>
              <h4 className="font-bold text-yellow-800">Temps restant: {formatTime(timeLeft)}</h4>
              <p className="text-sm text-yellow-700 mt-1">
                  ⚠️ Vous disposez de 20 minutes pour effectuer votre paiement, sinon la priorité sur cette parcelle sera perdue.
              </p>
          </div>
      </div>

      {!method ? (
        <>
            <h3 className="text-center font-bold text-gray-700 mb-4">Sélectionnez un compte Mobile Money</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
                onClick={() => setMethod('ORANGE_MONEY')}
                className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition group bg-white"
            >
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-orange-500 mb-3 font-bold text-xs overflow-hidden border-2 border-orange-500">
                   <span className="bg-orange-500 text-white w-full h-full flex items-center justify-center">OM</span>
                </div>
                <span className="font-bold text-gray-800">Orange Money</span>
            </button>

            <button 
                onClick={() => setMethod('MOOV_MONEY')}
                className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group bg-white"
            >
                 <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white mb-3 font-bold text-xs border-2 border-blue-800">
                   MM
                </div>
                <span className="font-bold text-gray-800">Moov Money</span>
            </button>
            </div>
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
            <button onClick={() => setMethod(null as any)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
              <ChevronLeft size={16} /> Changer
            </button>
            <div className="font-bold text-gray-700">{method === 'ORANGE_MONEY' ? 'Orange Money' : 'Moov Money'}</div>
          </div>

          <div className="p-6 space-y-6">
             {/* Infos Souscription */}
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-900">
                 <p><strong>Nom:</strong> {userData.fullName}</p>
                 <p><strong>Téléphone:</strong> {userData.phone}</p>
                 <p><strong>Parcelle:</strong> {parcel.id}</p>
             </div>

             {/* Instructions */}
             <div className="border-2 border-dashed border-gray-300 p-5 rounded-xl">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Smartphone size={20} /> 
                    Instructions {method === 'ORANGE_MONEY' ? 'Orange Money' : 'Moov Money'}
                </h4>
                
                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 font-medium">
                    {method === 'ORANGE_MONEY' ? (
                        <>
                            <li>Composez <strong>*144#</strong> sur votre téléphone</li>
                            <li>Sélectionnez "Transfert d'argent"</li>
                            <li>Entrez le numéro : <strong>{SONATUR_PHONE}</strong></li>
                            <li>Entrez le montant : <strong>{parcel.subscriptionFee.toLocaleString()} FCFA</strong></li>
                            <li>Confirmez avec votre code PIN</li>
                            <li>Conservez le reçu de transaction (SMS)</li>
                        </>
                    ) : (
                         <>
                            <li>Composez <strong>*555#</strong> sur votre téléphone</li>
                            <li>Sélectionnez "Transfert d'argent"</li>
                            <li>Entrez le numéro : <strong>{SONATUR_PHONE}</strong></li>
                            <li>Entrez le montant : <strong>{parcel.subscriptionFee.toLocaleString()} FCFA</strong></li>
                            <li>Confirmez avec votre code PIN</li>
                            <li>Conservez le reçu de transaction (SMS)</li>
                        </>
                    )}
                </ol>
             </div>

             <div className="bg-yellow-50 p-4 rounded-lg text-xs text-yellow-800 flex gap-2 items-start">
                 <Info size={16} className="shrink-0 mt-0.5" />
                 <p>Important : Après avoir effectué le paiement, cliquez sur le bouton ci-dessous pour nous contacter. Notre équipe traitera votre paiement et validera votre souscription.</p>
             </div>

             <a 
               href={generateWhatsAppLink()}
               target="_blank"
               rel="noopener noreferrer"
               onClick={onPaymentStart}
               className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
             >
                 <MessageCircle size={24} />
                 Confirmer et Envoyer sur WhatsApp
             </a>
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
    idIssueDate: '', idIssuePlace: 'Ouaga', address: '', city: '', country: ''
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

  // --- Supabase Data Loading & Realtime ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      const { data: parcelsData, error: parcelsError } = await safeSupabaseQuery(
        supabase.from('parcels').select('*')
      );
      if (parcelsData && Array.isArray(parcelsData) && parcelsData.length > 0) {
        setParcels(parcelsData as unknown as ParcelType[]);
      }
      setIsLoadingData(false);
    };

    loadData();

    // Realtime Subscription for Parcels
    const channel = supabase
      .channel('public:parcels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parcels' }, (payload) => {
         if (payload.eventType === 'INSERT') {
             setParcels(prev => [...prev, payload.new as ParcelType]);
         } else if (payload.eventType === 'UPDATE') {
             setParcels(prev => prev.map(p => p.id === payload.new.id ? payload.new as ParcelType : p));
         } else if (payload.eventType === 'DELETE') {
             setParcels(prev => prev.filter(p => p.id !== payload.old.id));
         }
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // Load Subscriptions only when Admin logs in
  useEffect(() => {
    if (isAdminLoggedIn) {
       const fetchSubs = async () => {
          const { data } = await safeSupabaseQuery(
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

  const handleConditionAccept = () => {
      setConditionsAccepted(true);
      nextStep(); // Auto redirect
  };

  const sendAdminNotification = async (subId: string, parcelId: string) => {
      // Simulation of email notification since we don't have a backend to send real emails.
      // In a real app, this would call a Supabase Function or API.
      console.log(`[SIMULATION EMAIL] Notification envoyée à l'admin pour la souscription ${subId}`);
      const timestamp = new Date().toLocaleTimeString();
      setLastEmailSent(`Nouveau dossier: ${subId} (${timestamp})`);
      
      // Optional: If we had an API
      /* await fetch('/api/send-email', { 
           method: 'POST', 
           body: JSON.stringify({ subject: 'Nouvelle souscription', id: subId }) 
         }); 
      */
  };

  const handleWhatsAppRedirect = async () => {
    setPaymentStatus('COMPLETED');
    
    // Create Subscription Record
    const subId = "SUB-" + Date.now().toString().slice(-6);
    const newSub: SubscriptionRecord = {
        id: subId,
        date: new Date().toISOString(),
        userData: userData,
        parcelId: selectedParcel!.id,
        status: 'PENDING',
        paymentMethod: paymentMethod!,
        history: [{
            status: 'PENDING',
            date: new Date().toISOString(),
            updatedBy: 'SYSTEM',
            comment: 'Souscription initiée via WhatsApp'
        }]
    };

    // Save to Supabase
    await safeSupabaseQuery(
        supabase.from('subscriptions').insert([newSub])
    );
    setSubscriptions(prev => [newSub, ...prev]);

    // Update Parcel Status to RESERVED
    if (selectedParcel) {
        await safeSupabaseQuery(
             supabase.from('parcels').update({ status: 'RESERVED' }).eq('id', selectedParcel.id)
        );
        // Optimistic update already handled by Realtime, but failsafe:
        setParcels(prev => prev.map(p => p.id === selectedParcel.id ? { ...p, status: 'RESERVED' } : p));
    }
    
    // Trigger Email Notification Simulation
    await sendAdminNotification(subId, selectedParcel!.id);

    nextStep(); // Go to Confirmation page
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
    if (now - lastClickTimeRef.current > 1000) {
      clickCountRef.current = 0;
    }
    clickCountRef.current += 1;
    lastClickTimeRef.current = now;
    if (clickCountRef.current >= 7) {
      setIsAdminLoginOpen(true);
      clickCountRef.current = 0;
    }
  };

  if (isAdminLoggedIn) {
    return (
      <AdminPanel 
        parcels={parcels}
        subscriptions={subscriptions}
        onLogout={handleLogout}
        lastEmailSent={lastEmailSent}
        onUpdateParcel={async (updatedParcel) => {
            await safeSupabaseQuery(supabase.from('parcels').update(updatedParcel).eq('id', updatedParcel.id));
        }}
        onAddParcel={async (newParcel) => {
            await safeSupabaseQuery(supabase.from('parcels').insert([newParcel]));
        }}
        onDeleteParcel={async (id) => {
            const { error } = await safeSupabaseQuery(supabase.from('parcels').delete().eq('id', id));
            if (error) alert("Erreur lors de la suppression. Vérifiez les dépendances.");
        }}
        onUpdateSubscription={async (id, status) => {
            const timestamp = new Date().toISOString();
            const newEntry = { 
                status, 
                date: timestamp, 
                updatedBy: 'ADMIN', 
                comment: status === 'VALIDATED' ? 'Dossier validé' : 'Dossier rejeté' 
            };
            
            // Update local state immediately
            setSubscriptions(prev => prev.map(sub => sub.id === id ? { ...sub, status, history: [...sub.history, newEntry] } : sub));

            // Update DB
            await safeSupabaseQuery(
                supabase.from('subscriptions').update({ 
                    status, 
                    history: subscriptions.find(s => s.id === id)?.history.concat(newEntry) 
                }).eq('id', id)
            );
        }}
      />
    );
  }

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
               <h1 className="text-xl font-bold text-gray-900 leading-tight">SONATUR</h1>
               <p className="text-xs text-gray-500 font-medium">Portail Officiel de Souscription</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
             <span className="flex items-center gap-1.5"><Phone size={16} className="text-green-600"/> {SONATUR_PHONE}</span>
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
                  onToggle={handleConditionAccept} 
                />
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
                  <Button onClick={nextStep} disabled={!userData.fullName || !userData.phone || !userData.idNumber || !userData.country}>
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

            {step === SubscriptionStep.RECAP && selectedParcel && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StepRecap 
                        userData={userData}
                        parcel={selectedParcel}
                        programName="Vente de parcelles - Ziniaré"
                    />
                    <div className="mt-6 flex justify-between">
                        <Button variant="outline" onClick={prevStep}>Retour</Button>
                        <Button onClick={nextStep}>
                            Procéder au paiement <ChevronRight size={18} className="ml-2" />
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
                  onPaymentStart={handleWhatsAppRedirect}
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
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Merci !</h2>
                  <p className="text-lg text-gray-600 mb-6">✅ Merci pour votre souscription ! Votre paiement est en cours de vérification.</p>
                  
                  <p className="text-sm text-gray-500 mb-8">
                    Veuillez patienter, vous recevrez une confirmation par SMS ou WhatsApp une fois la vérification terminée.
                  </p>

                  <div className="space-y-3">
                    <Button className="w-full justify-center" onClick={() => window.location.reload()}>
                        Retour à l'accueil
                    </Button>
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
              <p className="text-slate-400 text-sm leading-relaxed">Société Nationale d'Aménagement des Terrains Urbains.</p>
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
                  <MessageCircle size={18} /> {SONATUR_PHONE}
               </a>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm flex justify-center">
            <p 
              onClick={handleSecretAdminAccess}
              className="cursor-default select-none active:text-slate-400 transition-colors"
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
