
import React, { useState, useEffect } from 'react';
import { ParcelType, SubscriptionRecord, StatusHistoryEntry } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  Settings, 
  LogOut, 
  Search, 
  Check, 
  X, 
  Edit, 
  Plus, 
  Trash2,
  DollarSign,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Bell,
  PieChart,
  BarChart,
  FileText,
  Calendar,
  Clock,
  History
} from 'lucide-react';
import Button from './Button';

interface AdminPanelProps {
  parcels: ParcelType[];
  subscriptions: SubscriptionRecord[];
  onUpdateParcel: (parcel: ParcelType) => void;
  onAddParcel: (parcel: ParcelType) => void;
  onDeleteParcel: (id: string) => void;
  onUpdateSubscription: (id: string, status: 'VALIDATED' | 'REJECTED') => void;
  onLogout: () => void;
  lastEmailSent: string | null;
}

// --- CHART COMPONENTS ---
const DashboardCharts: React.FC<{ subscriptions: SubscriptionRecord[]; parcels: ParcelType[] }> = ({ subscriptions, parcels }) => {
    // 1. Prepare Data for Bar Chart (Subscriptions by Month)
    const subsByMonth: Record<string, number> = {};
    subscriptions.forEach(sub => {
        const month = sub.date.substring(0, 7); // "YYYY-MM"
        subsByMonth[month] = (subsByMonth[month] || 0) + 1;
    });
    const sortedMonths = Object.keys(subsByMonth).sort();
    const maxSubs = Math.max(...Object.values(subsByMonth), 5); // Ensure at least some height

    // 2. Prepare Data for Pie Chart (Parcels by Category)
    const parcelsByCategory: Record<string, number> = {};
    parcels.forEach(p => {
        parcelsByCategory[p.category] = (parcelsByCategory[p.category] || 0) + 1;
    });
    const totalParcels = parcels.length;
    const categoryColors = ['#16a34a', '#2563eb', '#ea580c', '#d97706', '#9333ea']; // green, blue, orange, yellow, purple

    // Generate Conic Gradient string for Pie Chart
    let gradientString = '';
    let currentPercent = 0;
    Object.entries(parcelsByCategory).forEach(([cat, count], index) => {
        const percent = (count / totalParcels) * 100;
        const color = categoryColors[index % categoryColors.length];
        gradientString += `${color} ${currentPercent}% ${currentPercent + percent}%, `;
        currentPercent += percent;
    });
    gradientString = gradientString.slice(0, -2); // remove trailing comma

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart size={20} className="text-blue-600" />
                    Évolution des Souscriptions
                </h3>
                <div className="h-48 flex items-end gap-4 border-b border-gray-200 pb-2">
                    {sortedMonths.length > 0 ? sortedMonths.map(month => (
                        <div key={month} className="flex flex-col items-center flex-1 group">
                            <div 
                                style={{ height: `${(subsByMonth[month] / maxSubs) * 100}%` }} 
                                className="w-full max-w-[40px] bg-blue-500 rounded-t-sm group-hover:bg-blue-600 transition-all relative"
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                                    {subsByMonth[month]}
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-500 mt-2 -rotate-45 origin-top-left translate-y-2">{month}</span>
                        </div>
                    )) : <p className="text-gray-400 text-sm w-full text-center">Aucune donnée</p>}
                </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <PieChart size={20} className="text-purple-600" />
                    Répartition du Foncier
                </h3>
                <div className="flex items-center gap-8">
                    <div 
                        className="w-32 h-32 rounded-full shrink-0 shadow-inner border-4 border-white ring-1 ring-gray-100"
                        style={{ background: `conic-gradient(${gradientString || '#e5e7eb 0% 100%'})` }}
                    ></div>
                    <div className="space-y-2 text-xs max-h-40 overflow-y-auto custom-scrollbar">
                        {Object.entries(parcelsByCategory).map(([cat, count], index) => (
                            <div key={cat} className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                                ></div>
                                <span className="text-gray-600 font-medium flex-1">{cat}</span>
                                <span className="font-bold text-gray-800">{count} ({Math.round((count/totalParcels)*100)}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  parcels, 
  subscriptions, 
  onUpdateParcel, 
  onAddParcel,
  onDeleteParcel,
  onUpdateSubscription, 
  onLogout,
  lastEmailSent
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscriptions' | 'parcels'>('dashboard');
  const [isAddingParcel, setIsAddingParcel] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [viewingSub, setViewingSub] = useState<SubscriptionRecord | null>(null);
  const [parcelToDelete, setParcelToDelete] = useState<ParcelType | null>(null);
  
  // Filters & Search States
  const [parcelFilterCategory, setParcelFilterCategory] = useState('ALL');
  const [parcelFilterStatus, setParcelFilterStatus] = useState('ALL');
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [subDateStart, setSubDateStart] = useState('');
  const [subDateEnd, setSubDateEnd] = useState('');
  
  // Validation State
  const [idError, setIdError] = useState<string | null>(null);

  // Default empty parcel for new entries
  const [newParcel, setNewParcel] = useState<ParcelType>({
    id: '',
    category: 'Habitation Ordinaire',
    area: 300,
    pricePerM2: 5000,
    totalPrice: 1500000,
    subscriptionFee: 50000,
    description: '',
    status: 'AVAILABLE'
  });

  // Auto-calculate total price when area or price per m2 changes
  useEffect(() => {
    setNewParcel(prev => ({
      ...prev,
      totalPrice: prev.area * prev.pricePerM2
    }));
  }, [newParcel.area, newParcel.pricePerM2]);

  // Helper to open edit modal
  const openEditModal = (parcel: ParcelType) => {
      setNewParcel(parcel);
      setIsEditingMode(true);
      setIsAddingParcel(true);
      setIdError(null);
  }

  // Helper for Number Inputs with Spaces
  const handleFormattedNumberChange = (field: keyof ParcelType, value: string) => {
      // Remove all non-numeric chars (spaces, etc)
      const cleanValue = value.replace(/[^0-9]/g, '');
      const numberValue = cleanValue ? parseInt(cleanValue, 10) : 0;
      setNewParcel({ ...newParcel, [field]: numberValue });
  };

  const formatNumber = (num: number) => {
      return num.toLocaleString('fr-FR');
  };

  // Export to CSV Helper
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
      alert("Aucune donnée à exporter");
      return;
    }
    
    const headers = Object.keys(data[0]).join(';');
    const rows = data.map(row => 
      Object.values(row).map(value => {
        const stringValue = String(value);
        return `"${stringValue.replace(/"/g, '""')}"`; 
      }).join(';')
    );

    const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveParcel = () => {
    setIdError(null);

    // Relaxed validation: only check if fields are not empty
    if (!newParcel.id || !newParcel.category) {
      alert("Veuillez remplir au moins l'ID et la Catégorie");
      return;
    }

    // If not editing, check if ID already exists (Keep this for data integrity)
    if (!isEditingMode && parcels.some(p => p.id === newParcel.id)) {
      setIdError("Cet ID de parcelle existe déjà.");
      return;
    }

    if (isEditingMode) {
        onUpdateParcel(newParcel);
    } else {
        onAddParcel(newParcel);
    }
    
    setIsAddingParcel(false);
    setIsEditingMode(false);
    // Reset form
    setNewParcel({
      id: '',
      category: 'Habitation Ordinaire',
      area: 300,
      pricePerM2: 5000,
      totalPrice: 1500000,
      subscriptionFee: 50000,
      description: '',
      status: 'AVAILABLE'
    });
  };

  // --- DATA FILTERING ---
  const filteredParcels = parcels.filter(parcel => {
    const matchCategory = parcelFilterCategory === 'ALL' || parcel.category === parcelFilterCategory;
    const matchStatus = parcelFilterStatus === 'ALL' || parcel.status === parcelFilterStatus;
    return matchCategory && matchStatus;
  });

  const filteredSubscriptions = subscriptions.filter(sub => {
    const searchLower = subscriptionSearch.toLowerCase();
    const matchesSearch = (
      sub.userData.fullName.toLowerCase().includes(searchLower) ||
      sub.userData.phone.includes(searchLower) ||
      sub.parcelId.toLowerCase().includes(searchLower) ||
      sub.id.toLowerCase().includes(searchLower)
    );

    // Date filtering
    const subDate = new Date(sub.date);
    let matchesDate = true;
    if (subDateStart) {
        matchesDate = matchesDate && subDate >= new Date(subDateStart);
    }
    if (subDateEnd) {
        // End of day
        const endDate = new Date(subDateEnd);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && subDate <= endDate;
    }

    return matchesSearch && matchesDate;
  });

  // --- EXPORT ACTIONS ---
  const handleExportParcels = () => {
    const dataToExport = filteredParcels.map(p => ({
      ID: p.id,
      Categorie: p.category,
      Surface: p.area,
      Prix_M2: p.pricePerM2,
      Prix_Total: p.totalPrice,
      Statut: p.status,
      Description: p.description
    }));
    exportToCSV(dataToExport, 'export_parcelles');
  };

  const handleExportSubscriptions = () => {
    const dataToExport = filteredSubscriptions.map(s => ({
      ID_Souscription: s.id,
      Date: s.date,
      Nom_Client: s.userData.fullName,
      Telephone: s.userData.phone,
      ID_Parcelle: s.parcelId,
      Statut: s.status,
      Mode_Paiement: s.paymentMethod
    }));
    exportToCSV(dataToExport, 'export_souscriptions');
  };

  // Calcul Stats
  const totalRevenue = subscriptions
    .filter(s => s.status === 'VALIDATED')
    .reduce((acc, sub) => {
      const parcel = parcels.find(p => p.id === sub.parcelId);
      return acc + (parcel ? parcel.subscriptionFee : 0);
    }, 0);

  const availableParcelsCount = parcels.filter(p => p.status === 'AVAILABLE').length;
  const pendingSubscriptionsCount = subscriptions.filter(s => s.status === 'PENDING').length;

  // --- RENDERS ---

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <DollarSign size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500">Frais encaissés</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalRevenue.toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span></h3>
            </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <Map size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500">Disponibles</p>
                <h3 className="text-2xl font-bold text-gray-800">{availableParcelsCount} <span className="text-xs font-normal text-gray-400">/ {parcels.length}</span></h3>
            </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                <Users size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500">En attente</p>
                <h3 className="text-2xl font-bold text-gray-800">{pendingSubscriptionsCount}</h3>
            </div>
            </div>
        </div>
        
        {/* Email Notification Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full relative">
                <Bell size={24} />
                {lastEmailSent && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm text-gray-500">Emails système</p>
                <h3 className="text-xs font-medium text-gray-800 truncate" title={lastEmailSent || "Aucune notification"}>
                    {lastEmailSent ? "Envoyé récemment" : "En attente"}
                </h3>
            </div>
            </div>
        </div>
      </div>

      {/* Add Charts Here */}
      <DashboardCharts subscriptions={subscriptions} parcels={parcels} />
    </>
  );

  // Updated renderAddParcelModal for Flexibility and Formatted Inputs
  const renderAddParcelModal = () => {
    if (!isAddingParcel) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Plus className="text-green-600" />
                {isEditingMode ? 'Modifier la parcelle' : 'Ajouter une nouvelle parcelle'}
            </h3>
            <button 
              onClick={() => setIsAddingParcel(false)}
              className="text-gray-400 hover:text-red-500 transition"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 space-y-5">
            {/* Alert Info */}
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-sm border border-blue-100">
                <AlertCircle size={20} className="shrink-0" />
                <p>Les montants sont automatiquement formatés avec des espaces. Le prix total est calculé automatiquement.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">ID Parcelle (Unique) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={newParcel.id}
                  disabled={isEditingMode} // Disable ID editing
                  onChange={(e) => {
                    setNewParcel({...newParcel, id: e.target.value.toUpperCase()});
                    setIdError(null);
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 outline-none uppercase font-mono transition
                    ${idError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-green-500'}
                    ${isEditingMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="EX: PARCEL-LOT01-SEC-A"
                />
                {idError && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {idError}
                    </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <div className="relative">
                    <input
                      list="categories"
                      value={newParcel.category}
                      onChange={(e) => setNewParcel({...newParcel, category: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Sélectionner ou saisir..."
                    />
                    <datalist id="categories">
                      <option value="Habitation Ordinaire" />
                      <option value="Habitation Angle" />
                      <option value="Commerce Voie Non Bitumée" />
                      <option value="Logement Social" />
                      <option value="Zone Industrielle" />
                    </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut Initial</label>
                <select 
                  value={newParcel.status}
                  onChange={(e) => setNewParcel({...newParcel, status: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="AVAILABLE">Disponible</option>
                  <option value="RESERVED">Réservé</option>
                  <option value="SOLD">Vendu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Surface (m²)</label>
                <input 
                  type="text"
                  value={formatNumber(newParcel.area)} 
                  onChange={(e) => handleFormattedNumberChange('area', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix Unitaire (FCFA/m²)</label>
                <input 
                  type="text"
                  value={formatNumber(newParcel.pricePerM2)} 
                  onChange={(e) => handleFormattedNumberChange('pricePerM2', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 5 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix Total (Calculé)</label>
                <input 
                  type="text" 
                  value={formatNumber(newParcel.totalPrice)}
                  readOnly
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 font-bold text-gray-800 cursor-not-allowed"
                />
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frais de dossier (FCFA)</label>
                <input 
                  type="text" 
                  value={formatNumber(newParcel.subscriptionFee)} 
                  onChange={(e) => handleFormattedNumberChange('subscriptionFee', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 50 000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Texte Libre)</label>
                <textarea 
                  value={newParcel.description}
                  onChange={(e) => setNewParcel({...newParcel, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  rows={5}
                  placeholder="Description libre, code HTML, ou JSON..."
                />
                <p className="text-xs text-gray-500 mt-1">Aucune restriction de format.</p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
            <Button variant="outline" onClick={() => setIsAddingParcel(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleSaveParcel}>{isEditingMode ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="font-bold text-xl flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">A</div>
            SONATUR Admin
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard size={20} /> Tableau de bord
          </button>
          <button onClick={() => setActiveTab('subscriptions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'subscriptions' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Users size={20} /> Souscriptions
          </button>
          <button onClick={() => setActiveTab('parcels')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'parcels' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Map size={20} /> Parcelles
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition text-sm">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto relative h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'dashboard' ? 'Vue d\'ensemble' : 
               activeTab === 'subscriptions' ? 'Gestion des Souscriptions' : 'Parc Foncier (Mode Flexible)'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-700">Administrateur</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shadow-sm border border-green-200">AD</div>
          </div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}
        
        {activeTab === 'subscriptions' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                   <h2 className="text-lg font-bold text-gray-800">Liste des Souscriptions</h2>
                   <div className="flex gap-2">
                       <input type="text" placeholder="Rechercher..." className="border p-2 rounded text-sm" value={subscriptionSearch} onChange={e => setSubscriptionSearch(e.target.value)} />
                       <button onClick={handleExportSubscriptions} className="bg-gray-100 p-2 rounded"><Download size={16}/></button>
                   </div>
               </div>
               <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Client</th>
                                <th className="px-6 py-3">Parcelle</th>
                                <th className="px-6 py-3">Statut</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscriptions.map(sub => (
                                <tr key={sub.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-3">{new Date(sub.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-3">{sub.userData.fullName}</td>
                                    <td className="px-6 py-3">{sub.parcelId}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${sub.status === 'VALIDATED' ? 'bg-green-100 text-green-700' : sub.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                                        {sub.status === 'PENDING' && (
                                            <>
                                            <button onClick={() => onUpdateSubscription(sub.id, 'VALIDATED')} className="text-green-600 p-1 hover:bg-green-50 rounded" title="Valider"><Check size={16}/></button>
                                            <button onClick={() => onUpdateSubscription(sub.id, 'REJECTED')} className="text-red-600 p-1 hover:bg-red-50 rounded" title="Rejeter"><X size={16}/></button>
                                            </>
                                        )}
                                        <button onClick={() => setViewingSub(sub)} className="text-blue-600 p-1 hover:bg-blue-50 rounded" title="Voir détails"><Eye size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
               </div>
           </div>
        )}

        {activeTab === 'parcels' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Gestion Parcelles</h2>
                    <div className="flex gap-2">
                        <Button variant="primary" onClick={() => { setIsEditingMode(false); setIsAddingParcel(true); }} className="text-xs py-2 px-3 flex items-center gap-2">
                            <Plus size={16} /> Ajouter
                        </Button>
                        <button onClick={handleExportParcels} className="bg-gray-100 p-2 rounded"><FileSpreadsheet size={16}/></button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                         <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Catégorie</th>
                                <th className="px-6 py-3">Statut</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParcels.map(p => (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-3 font-mono">{p.id}</td>
                                    <td className="px-6 py-3">{p.category}</td>
                                    <td className="px-6 py-3">
                                        <select 
                                            value={p.status}
                                            onChange={(e) => onUpdateParcel({...p, status: e.target.value as any})}
                                            className="border rounded p-1 text-xs"
                                        >
                                            <option value="AVAILABLE">DISPONIBLE</option>
                                            <option value="RESERVED">RÉSERVÉ</option>
                                            <option value="SOLD">VENDU</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                                        <button onClick={() => openEditModal(p)} className="text-gray-500 hover:text-green-600"><Edit size={16}/></button>
                                        <button onClick={() => setParcelToDelete(p)} className="text-gray-500 hover:text-red-600"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        
        {/* Modals */}
        {renderAddParcelModal()}
        
        {viewingSub && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-lg flex items-center gap-2">
                             <FileText size={20} className="text-green-600"/>
                             Détails Souscription
                         </h3>
                         <button onClick={() => setViewingSub(null)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                    </div>
                    
                    {/* Client Info */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm space-y-2">
                        <p><span className="font-bold text-gray-700">ID:</span> {viewingSub.id}</p>
                        <p><span className="font-bold text-gray-700">Nom:</span> {viewingSub.userData.fullName}</p>
                        <p><span className="font-bold text-gray-700">Téléphone:</span> {viewingSub.userData.phone}</p>
                        <p><span className="font-bold text-gray-700">Paiement:</span> {viewingSub.paymentMethod}</p>
                        <p><span className="font-bold text-gray-700">Parcelle:</span> {viewingSub.parcelId}</p>
                    </div>

                    {/* Status History Timeline */}
                    <div className="border-t pt-4">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <History size={18} /> Historique des statuts
                        </h4>
                        <div className="space-y-0 relative pl-2">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200"></div>

                            {viewingSub.history && viewingSub.history.length > 0 ? (
                                viewingSub.history.map((entry, index) => (
                                    <div key={index} className="relative flex gap-4 items-start mb-6 last:mb-0">
                                        <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0
                                            ${entry.status === 'VALIDATED' ? 'bg-green-100 text-green-600' : 
                                              entry.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            {entry.status === 'VALIDATED' ? <Check size={16} /> : 
                                             entry.status === 'REJECTED' ? <X size={16} /> : <Clock size={16} />}
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <p className="font-bold text-gray-800 text-sm">
                                                {entry.status === 'PENDING' ? 'Dossier créé (En attente)' : 
                                                 entry.status === 'VALIDATED' ? 'Dossier Validé' : 'Dossier Rejeté'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(entry.date).toLocaleString('fr-FR')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Users size={10} /> Modifié par: {entry.updatedBy}
                                            </p>
                                            {entry.comment && (
                                                <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600 italic border border-gray-100">
                                                    "{entry.comment}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic pl-4">Aucun historique disponible.</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                        <Button variant="outline" onClick={() => setViewingSub(null)}>Fermer</Button>
                    </div>
                </div>
            </div>
        )}
        
        {parcelToDelete && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
                    <h3 className="font-bold text-lg mb-2">Supprimer ?</h3>
                    <p className="mb-4 text-sm">Confirmer la suppression de {parcelToDelete.id}</p>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setParcelToDelete(null)}>Annuler</Button>
                        <Button variant="danger" onClick={() => { onDeleteParcel(parcelToDelete.id); setParcelToDelete(null); }}>Supprimer</Button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
