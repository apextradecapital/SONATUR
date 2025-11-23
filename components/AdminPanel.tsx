
import React, { useState, useEffect } from 'react';
import { ParcelType, SubscriptionRecord, SystemSettings } from '../types';
import { Settings, LogOut, Save, Smartphone, FileText, Percent, Clock, Trash2, AlertTriangle, Plus, X, Upload, Edit, Filter, Download, Users, Globe, Phone, Mail, MapPin, Lock, Image as ImageIcon } from 'lucide-react';
import Button from './Button';

interface AdminPanelProps {
  parcels: ParcelType[];
  subscriptions: SubscriptionRecord[];
  settings: SystemSettings;
  onUpdateParcel: (parcel: ParcelType) => void;
  onAddParcel: (parcel: ParcelType) => void;
  onDeleteParcel: (id: string) => void;
  onUpdateSubscription: (id: string, status: 'VALIDATED' | 'REJECTED') => void;
  onUpdateSettings: (settings: SystemSettings) => void;
  onLogout: () => void;
  lastEmailSent: string | null;
}

const DEFAULT_LANDSCAPE_IMAGE = "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop";

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  parcels,
  subscriptions,
  settings,
  onUpdateSettings,
  onDeleteParcel,
  onUpdateParcel,
  onAddParcel,
  onLogout
}) => {
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [activeTab, setActiveTab] = useState<'settings' | 'parcels' | 'subscriptions'>('settings');
  
  // Parcel Management State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [siteFilter, setSiteFilter] = useState<string>('ALL'); // Nouveau filtre site
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);
  const [currentParcel, setCurrentParcel] = useState<Partial<ParcelType>>({});

  useEffect(() => { setLocalSettings(settings); }, [settings]);

  const handleSaveSettings = () => {
      onUpdateSettings(localSettings);
      alert('Paramètres mis à jour !');
  };

  const confirmDelete = () => {
      if (deleteConfirmationId) {
          onDeleteParcel(deleteConfirmationId);
          setDeleteConfirmationId(null);
      }
  };

  // Liste unique des sites pour le filtre
  const availableSites = Array.from(new Set(parcels.map(p => p.site))).sort();

  const filteredParcels = parcels.filter(p => {
      const statusMatch = statusFilter === 'ALL' || p.status === statusFilter;
      const siteMatch = siteFilter === 'ALL' || p.site === siteFilter;
      return statusMatch && siteMatch;
  });

  const handleOpenAddModal = () => {
      setCurrentParcel({
          id: '',
          site: 'ZINIARE',
          category: 'Habitation Ordinaire',
          area: 300,
          pricePerM2: 5000,
          totalPrice: 1500000,
          subscriptionFee: 50000,
          description: '',
          status: 'AVAILABLE',
          imageUrl: ''
      });
      setIsParcelModalOpen(true);
  };

  const handleOpenEditModal = (parcel: ParcelType) => {
      setCurrentParcel({ ...parcel });
      setIsParcelModalOpen(true);
  };

  const handleSaveParcel = () => {
      if (!currentParcel.id || !currentParcel.site || !currentParcel.category) {
          alert("Veuillez remplir les champs obligatoires (ID, Site, Catégorie)");
          return;
      }

      // Assignation automatique image par défaut si vide
      const finalParcel = {
          ...currentParcel,
          imageUrl: (currentParcel.imageUrl && currentParcel.imageUrl.trim() !== '') 
              ? currentParcel.imageUrl 
              : DEFAULT_LANDSCAPE_IMAGE
      } as ParcelType;

      const existing = parcels.find(p => p.id === finalParcel.id);
      
      if (existing) {
         onUpdateParcel(finalParcel);
      } else {
         onAddParcel(finalParcel);
      }
      setIsParcelModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setCurrentParcel(prev => ({ ...prev, imageUrl: event.target!.result as string }));
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleExportSubscriptionsCSV = () => {
      if (subscriptions.length === 0) {
          alert("Aucune souscription à exporter.");
          return;
      }

      const headers = [
          "ID", "Date", "Statut", "Paiement", 
          "Nom Client", "Téléphone", "Email", "Pièce ID", "Numéro Pièce",
          "ID Parcelle", "Site", "Prix Parcelle"
      ];

      const csvContent = [
          headers.join(','),
          ...subscriptions.map(sub => {
              const parcel = parcels.find(p => p.id === sub.parcelId);
              return [
                  sub.id,
                  new Date(sub.date).toLocaleDateString('fr-FR'),
                  sub.status,
                  sub.paymentMethod,
                  `"${sub.userData.fullName.replace(/"/g, '""')}"`,
                  `"${sub.userData.phone}"`,
                  `"${sub.userData.email || ''}"`,
                  sub.userData.idType,
                  `"${sub.userData.idNumber}"`,
                  sub.parcelId,
                  parcel?.site || '',
                  parcel?.totalPrice || ''
              ].join(',');
          })
      ].join('\n');

      downloadCSV(csvContent, `souscriptions_sonatur_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportParcelsCSV = () => {
      if (filteredParcels.length === 0) {
          alert("Aucune parcelle à exporter.");
          return;
      }

      const headers = [
          "ID", "Site", "Catégorie", "Surface (m2)", "Prix/m2", "Prix Total", "Statut", "Description"
      ];

      const csvContent = [
          headers.join(','),
          ...filteredParcels.map(p => [
              p.id,
              p.site,
              `"${p.category}"`,
              p.area,
              p.pricePerM2,
              p.totalPrice,
              p.status,
              `"${p.description.replace(/"/g, '""')}"`
          ].join(','))
      ].join('\n');

      downloadCSV(csvContent, `parcelles_sonatur_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
      const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
       <aside className="w-full md:w-64 bg-[#009640] text-white p-6 shrink-0">
          <h1 className="font-bold text-2xl mb-8 flex items-center gap-2">
            ADMIN PANEL
          </h1>
          <nav className="space-y-2">
             <button 
                onClick={() => setActiveTab('settings')} 
                className={`flex items-center gap-2 w-full p-3 rounded transition-colors ${activeTab === 'settings' ? 'bg-white text-[#009640] font-bold' : 'hover:bg-white/10'}`}
             >
                <Settings size={20} /> Configuration
             </button>
             <button 
                onClick={() => setActiveTab('parcels')} 
                className={`flex items-center gap-2 w-full p-3 rounded transition-colors ${activeTab === 'parcels' ? 'bg-white text-[#009640] font-bold' : 'hover:bg-white/10'}`}
             >
                <FileText size={20} /> Gestion Parcelles
             </button>
             <button 
                onClick={() => setActiveTab('subscriptions')} 
                className={`flex items-center gap-2 w-full p-3 rounded transition-colors ${activeTab === 'subscriptions' ? 'bg-white text-[#009640] font-bold' : 'hover:bg-white/10'}`}
             >
                <Users size={20} /> Souscriptions
             </button>
             <button onClick={onLogout} className="flex items-center gap-2 w-full p-3 hover:bg-white/10 rounded mt-auto text-red-200 border-t border-white/20 pt-4 mt-8">
                <LogOut size={20} /> Déconnexion
             </button>
          </nav>
       </aside>
       
       <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
          <div className="max-w-6xl mx-auto space-y-8">
             
             {/* --- ONGLETS CONFIGURATION --- */}
             {activeTab === 'settings' && (
                 <div className="space-y-6 animate-in fade-in">
                    
                    {/* SECTION IDENTITÉ & CONTACT */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                            <Globe className="text-[#009640]" /> Identité & Contacts Centralisés
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nom de l'entreprise (Titre Principal)</label>
                                <input 
                                    type="text" 
                                    value={localSettings.companyName}
                                    onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#009640] outline-none"
                                />
                            </div>
                            
                            {/* PIN Admin */}
                            <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <Lock size={16} /> Code PIN Administrateur
                                </label>
                                <input 
                                    type="text" 
                                    value={localSettings.adminPin || ''}
                                    onChange={(e) => setLocalSettings({...localSettings, adminPin: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#009640] outline-none font-mono tracking-widest"
                                    placeholder="Ex: 1306"
                                />
                                <p className="text-xs text-yellow-800 mt-1">
                                    Ce code remplace la configuration par défaut. Laissez vide pour utiliser la valeur système (1306).
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Numéro WhatsApp (Flottant & Header)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={localSettings.whatsappNumber}
                                        onChange={(e) => setLocalSettings({...localSettings, whatsappNumber: e.target.value})}
                                        className="w-full p-3 border rounded-lg pl-10 focus:ring-2 focus:ring-[#009640] outline-none"
                                    />
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email de contact</label>
                                <div className="relative">
                                    <input 
                                        type="email" 
                                        value={localSettings.contactEmail}
                                        onChange={(e) => setLocalSettings({...localSettings, contactEmail: e.target.value})}
                                        className="w-full p-3 border rounded-lg pl-10 focus:ring-2 focus:ring-[#009640] outline-none"
                                    />
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Adresse Physique</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={localSettings.contactAddress}
                                        onChange={(e) => setLocalSettings({...localSettings, contactAddress: e.target.value})}
                                        className="w-full p-3 border rounded-lg pl-10 focus:ring-2 focus:ring-[#009640] outline-none"
                                    />
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Texte du Pied de page (Footer)</label>
                                <input 
                                    type="text" 
                                    value={localSettings.footerText}
                                    onChange={(e) => setLocalSettings({...localSettings, footerText: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#009640] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                            <FileText className="text-[#009640]" /> Textes & Conditions
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Conditions Générales (Texte complet)</label>
                                <textarea 
                                    value={localSettings.conditionsText}
                                    onChange={(e) => setLocalSettings({...localSettings, conditionsText: e.target.value})}
                                    rows={10}
                                    className="w-full p-3 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#009640] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Message d'avertissement (Paiement)</label>
                                <input 
                                    type="text" 
                                    value={localSettings.paymentWarningText}
                                    onChange={(e) => setLocalSettings({...localSettings, paymentWarningText: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#009640] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                            <Percent className="text-blue-600" /> Paramètres Financiers
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Acompte Habitation (%)</label>
                                <input 
                                    type="number" 
                                    value={localSettings.depositPercentHousing}
                                    onChange={(e) => setLocalSettings({...localSettings, depositPercentHousing: Number(e.target.value)})}
                                    className="w-full p-3 border rounded-lg font-bold text-lg focus:ring-2 focus:ring-[#009640] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Acompte Commerce (%)</label>
                                <input 
                                    type="number" 
                                    value={localSettings.depositPercentCommercial}
                                    onChange={(e) => setLocalSettings({...localSettings, depositPercentCommercial: Number(e.target.value)})}
                                    className="w-full p-3 border rounded-lg font-bold text-lg focus:ring-2 focus:ring-[#009640] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Timer Paiement (min)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={localSettings.timerDurationMinutes}
                                        onChange={(e) => setLocalSettings({...localSettings, timerDurationMinutes: Number(e.target.value)})}
                                        className="w-full p-3 border rounded-lg font-bold text-lg pl-10 focus:ring-2 focus:ring-[#009640] outline-none"
                                    />
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ORANGE MONEY CONFIG */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                                <Smartphone className="text-orange-500" /> Orange Money
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Code USSD</label>
                                    <input value={localSettings.orangeMoney.ussdCode} onChange={e => setLocalSettings({...localSettings, orangeMoney: {...localSettings.orangeMoney, ussdCode: e.target.value}})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Code Marchand (Technique)</label>
                                    <input value={localSettings.orangeMoney.merchantCode} onChange={e => setLocalSettings({...localSettings, orangeMoney: {...localSettings.orangeMoney, merchantCode: e.target.value}})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Nom du Bénéficiaire</label>
                                    <input value={localSettings.orangeMoney.recipientName} onChange={e => setLocalSettings({...localSettings, orangeMoney: {...localSettings.orangeMoney, recipientName: e.target.value}})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Étapes (Modifiables)</label>
                                    <div className="bg-yellow-50 p-2 text-xs text-yellow-800 mb-2 rounded border border-yellow-100">
                                        Modifiez le texte ci-dessous pour mettre à jour les instructions, y compris le numéro de dépôt.
                                    </div>
                                    <textarea 
                                        value={localSettings.orangeMoney.steps.join('\n')} 
                                        onChange={e => setLocalSettings({...localSettings, orangeMoney: {...localSettings.orangeMoney, steps: e.target.value.split('\n')}})} 
                                        className="w-full p-2 border rounded font-mono text-sm"
                                        rows={8}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* MOOV MONEY CONFIG */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                                <Smartphone className="text-blue-600" /> Moov Money
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Code USSD</label>
                                    <input value={localSettings.moovMoney.ussdCode} onChange={e => setLocalSettings({...localSettings, moovMoney: {...localSettings.moovMoney, ussdCode: e.target.value}})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Code Marchand (Technique)</label>
                                    <input value={localSettings.moovMoney.merchantCode} onChange={e => setLocalSettings({...localSettings, moovMoney: {...localSettings.moovMoney, merchantCode: e.target.value}})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Nom du Bénéficiaire</label>
                                    <input value={localSettings.moovMoney.recipientName} onChange={e => setLocalSettings({...localSettings, moovMoney: {...localSettings.moovMoney, recipientName: e.target.value}})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Étapes (Modifiables)</label>
                                    <div className="bg-yellow-50 p-2 text-xs text-yellow-800 mb-2 rounded border border-yellow-100">
                                        Modifiez le texte ci-dessous pour mettre à jour les instructions, y compris le numéro de dépôt.
                                    </div>
                                    <textarea 
                                        value={localSettings.moovMoney.steps.join('\n')} 
                                        onChange={e => setLocalSettings({...localSettings, moovMoney: {...localSettings.moovMoney, steps: e.target.value.split('\n')}})} 
                                        className="w-full p-2 border rounded font-mono text-sm"
                                        rows={8}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end sticky bottom-6 pointer-events-none">
                        <div className="pointer-events-auto shadow-xl rounded-lg">
                            <Button onClick={handleSaveSettings} className="bg-[#009640] text-lg px-8 py-3">
                                <Save className="mr-2" /> Enregistrer les modifications
                            </Button>
                        </div>
                    </div>
                 </div>
             )}

             {/* --- ONGLETS PARCELLES --- */}
             {activeTab === 'parcels' && (
                 <div className="space-y-6 animate-in fade-in">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
                        <div className="flex items-center gap-2 mb-2 xl:mb-0">
                             <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">Parcelles ({filteredParcels.length})</h2>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                            {/* Filtres */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                                    <span className="px-2 text-xs font-bold text-gray-400 uppercase">Statut</span>
                                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                                    <select 
                                        value={statusFilter} 
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                                    >
                                        <option value="ALL">Tous</option>
                                        <option value="AVAILABLE">Disponibles</option>
                                        <option value="RESERVED">Réservées</option>
                                        <option value="SOLD">Vendues</option>
                                    </select>
                                </div>

                                <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                                    <span className="px-2 text-xs font-bold text-gray-400 uppercase">Site</span>
                                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                                    <select 
                                        value={siteFilter} 
                                        onChange={(e) => setSiteFilter(e.target.value)}
                                        className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer max-w-[150px]"
                                    >
                                        <option value="ALL">Tous les sites</option>
                                        {availableSites.map(site => (
                                            <option key={site} value={site}>{site}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 ml-auto">
                                <Button onClick={handleExportParcelsCSV} className="bg-blue-600 text-sm whitespace-nowrap hover:bg-blue-700">
                                    <Download size={16} className="mr-2" /> Export CSV
                                </Button>
                                <Button onClick={handleOpenAddModal} className="bg-[#009640] text-sm whitespace-nowrap">
                                    <Plus size={16} className="mr-2" /> Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredParcels.map(parcel => (
                            <div 
                                key={parcel.id} 
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group hover:shadow-lg hover:border-green-300 transition-all duration-200 hover:-translate-y-1"
                            >
                                <div className="relative h-40 bg-gray-200 overflow-hidden">
                                    <img src={parcel.imageUrl} alt={parcel.id} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                                    <div className="absolute top-2 right-2">
                                         <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm
                                            ${parcel.status === 'AVAILABLE' ? 'bg-green-500 text-white' : 
                                              parcel.status === 'RESERVED' ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'}
                                         `}>
                                            {parcel.status}
                                         </span>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{parcel.id}</span>
                                            <h3 className="font-bold text-gray-800 mt-1">{parcel.site}</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{parcel.category} - {parcel.description}</p>
                                    
                                    <div className="mt-auto pt-3 border-t flex items-center justify-between">
                                        <span className="font-bold text-[#009640]">{parcel.totalPrice.toLocaleString()} F</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleOpenEditModal(parcel)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteConfirmationId(parcel.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             )}

             {/* --- ONGLETS SOUSCRIPTIONS --- */}
             {activeTab === 'subscriptions' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                         <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                             <Users className="text-[#009640]" /> Liste des Souscriptions ({subscriptions.length})
                         </h2>
                         <Button onClick={handleExportSubscriptionsCSV} className="bg-[#009640] text-sm">
                             <Download size={16} className="mr-2" /> Exporter CSV
                         </Button>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Client</th>
                                        <th className="px-6 py-3">Parcelle</th>
                                        <th className="px-6 py-3">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {subscriptions.length > 0 ? subscriptions.map(sub => (
                                        <tr key={sub.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">{new Date(sub.date).toLocaleDateString('fr-FR')}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{sub.userData.fullName}</div>
                                                <div className="text-xs">{sub.userData.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {sub.parcelId}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                                    ${sub.status === 'VALIDATED' ? 'bg-green-100 text-green-700' : 
                                                      sub.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                                                `}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Aucune souscription trouvée.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
             )}
          </div>
       </main>

       {/* --- MODAL AJOUT / MODIFICATION --- */}
       {isParcelModalOpen && (
           <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
                   <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                       <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                           {currentParcel.id && parcels.some(p => p.id === currentParcel.id) ? <Edit size={18}/> : <Plus size={18}/>}
                           {currentParcel.id && parcels.some(p => p.id === currentParcel.id) ? 'Modifier la parcelle' : 'Ajouter une parcelle'}
                       </h3>
                       <button onClick={() => setIsParcelModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                           <X size={24} />
                       </button>
                   </div>
                   
                   <div className="p-6 overflow-y-auto space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Identifiant (Unique)</label>
                                 <input 
                                     type="text" 
                                     value={currentParcel.id} 
                                     onChange={e => setCurrentParcel({...currentParcel, id: e.target.value})}
                                     className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                     placeholder="Ex: ZIN-HAB-001"
                                 />
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Site</label>
                                 <input 
                                     type="text" 
                                     list="sites-list"
                                     value={currentParcel.site} 
                                     onChange={e => setCurrentParcel({...currentParcel, site: e.target.value})}
                                     className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                     placeholder="Sélectionner ou écrire"
                                 />
                                 <datalist id="sites-list">
                                     <option value="ZINIARE" />
                                     <option value="BINDOUGOUSSO" />
                                     <option value="OURODARA" />
                                 </datalist>
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                                 <input 
                                     type="text" 
                                     value={currentParcel.category} 
                                     onChange={e => setCurrentParcel({...currentParcel, category: e.target.value})}
                                     className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                 />
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Statut</label>
                                 <select 
                                     value={currentParcel.status} 
                                     onChange={e => setCurrentParcel({...currentParcel, status: e.target.value as any})}
                                     className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                 >
                                     <option value="AVAILABLE">AVAILABLE</option>
                                     <option value="RESERVED">RESERVED</option>
                                     <option value="SOLD">SOLD</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Surface (m²)</label>
                                 <input 
                                     type="number" 
                                     value={currentParcel.area} 
                                     onChange={e => setCurrentParcel({...currentParcel, area: Number(e.target.value)})}
                                     className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                 />
                             </div>
                             
                             {/* PRIX AU M2 */}
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Prix par m²</label>
                                 <input 
                                     type="number" 
                                     value={currentParcel.pricePerM2} 
                                     onChange={e => setCurrentParcel({...currentParcel, pricePerM2: Number(e.target.value)})}
                                     className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none bg-yellow-50"
                                     placeholder="Indépendant du total"
                                 />
                             </div>

                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Prix Total</label>
                                 <input 
                                     type="number" 
                                     value={currentParcel.totalPrice} 
                                     onChange={e => setCurrentParcel({...currentParcel, totalPrice: Number(e.target.value)})}
                                     className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none font-bold"
                                 />
                             </div>

                             <div className="col-span-2">
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                 <textarea 
                                     value={currentParcel.description} 
                                     onChange={e => setCurrentParcel({...currentParcel, description: e.target.value})}
                                     className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                     rows={2}
                                 />
                             </div>
                             
                             <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative bg-gray-50">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                    />
                                    <div className="flex flex-col items-center pointer-events-none">
                                        {currentParcel.imageUrl ? (
                                            <>
                                              <img src={currentParcel.imageUrl} className="h-32 object-cover rounded-md shadow-sm mb-3" alt="Aperçu" />
                                              <span className="text-xs text-blue-600 font-bold">Cliquez pour changer l'image</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                                    <Upload size={24} />
                                                </div>
                                                <span className="text-sm text-gray-600 font-medium">Cliquez pour ajouter une photo</span>
                                                <span className="text-xs text-gray-400 mt-1">
                                                    Laissez vide pour utiliser l'image par défaut (Paysage Sahélien)
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                             </div>
                        </div>
                   </div>

                   <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                       <Button variant="outline" onClick={() => setIsParcelModalOpen(false)}>Annuler</Button>
                       <Button onClick={handleSaveParcel} className="bg-[#009640]">Enregistrer</Button>
                   </div>
               </div>
           </div>
       )}

       {/* --- MODAL CONFIRMATION SUPPRESSION --- */}
       {deleteConfirmationId && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
               <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
                   <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                       <AlertTriangle size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Confirmer la suppression</h3>
                   <p className="text-center text-gray-600 mb-6">
                       Êtes-vous sûr de vouloir supprimer définitivement la parcelle <span className="font-mono font-bold text-gray-900">{deleteConfirmationId}</span> ?
                       <br/><br/>
                       <span className="text-red-500 font-bold uppercase text-sm">Cette action est irréversible.</span>
                   </p>
                   <div className="flex gap-3">
                       <Button variant="outline" onClick={() => setDeleteConfirmationId(null)} className="flex-1">
                           Annuler
                       </Button>
                       <Button 
                            onClick={confirmDelete} 
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                           <Trash2 size={16} className="mr-2" /> Supprimer
                       </Button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default AdminPanel;
