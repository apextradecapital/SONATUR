
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
  Calendar
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

    if (!newParcel.id || !newParcel.category || !newParcel.description) {
      alert("Veuillez remplir tous les champs obligatoires (ID, Catégorie, Description)");
      return;
    }

    const idRegex = /^[A-Z0-9-]+$/i;
    if (!idRegex.test(newParcel.id)) {
      setIdError("L'ID ne doit contenir que des lettres, chiffres et tirets (-).");
      return;
    }

    // If not editing, check if ID already exists
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
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <Bell size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500">Dernière Notification</p>
                <h3 className="text-sm font-bold text-gray-800 truncate" title={lastEmailSent || "Aucune"}>
                    {lastEmailSent || "Aucune"}
                </h3>
            </div>
            </div>
        </div>
      </div>

      {/* Add Charts Here */}
      <DashboardCharts subscriptions={subscriptions} parcels={parcels} />
    </>
  );

  const renderSubscriptionDetailsModal = () => {
    if (!viewingSub) return null;
    const parcel = parcels.find(p => p.id === viewingSub.parcelId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200 flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Détails Dossier: {viewingSub.id}
                    </h3>
                    <button 
                        onClick={() => setViewingSub(null)}
                        className="text-gray-400 hover:text-red-500 transition"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Client Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 border-b pb-2 font-bold text-gray-500 text-xs uppercase">Informations Client</div>
                        <div>
                            <label className="text-xs text-gray-400">Nom Complet</label>
                            <p className="font-bold text-gray-800">{viewingSub.userData.fullName}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Téléphone</label>
                            <p className="font-bold text-gray-800">{viewingSub.userData.phone}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Email</label>
                            <p className="font-medium text-gray-700">{viewingSub.userData.email || '-'}</p>
                        </div>
                         <div>
                            <label className="text-xs text-gray-400">Pièce d'identité</label>
                            <p className="font-medium text-gray-700">{viewingSub.userData.idType} - {viewingSub.userData.idNumber}</p>
                        </div>
                    </div>

                    {/* Parcel Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 border-b pb-2 font-bold text-gray-500 text-xs uppercase">Parcelle</div>
                        <div>
                            <label className="text-xs text-gray-400">ID Parcelle</label>
                            <p className="font-mono font-bold text-gray-800">{viewingSub.parcelId}</p>
                        </div>
                         <div>
                            <label className="text-xs text-gray-400">Catégorie</label>
                            <p className="font-medium text-gray-700">{parcel?.category}</p>
                        </div>
                    </div>

                    {/* Status History */}
                    <div>
                        <div className="border-b pb-2 font-bold text-gray-500 text-xs uppercase mb-4">Historique des statuts</div>
                        <div className="space-y-0 pl-2 border-l-2 border-gray-200 ml-2">
                            {viewingSub.history && viewingSub.history.length > 0 ? viewingSub.history.map((entry, idx) => (
                                <div key={idx} className="relative pl-6 pb-6 last:pb-0">
                                    {/* Dot */}
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm
                                        ${entry.status === 'PENDING' ? 'bg-yellow-500' : 
                                          entry.status === 'VALIDATED' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 uppercase
                                                 ${entry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                                                   entry.status === 'VALIDATED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {entry.status}
                                            </span>
                                            <p className="text-sm text-gray-600 italic">"{entry.comment || 'Aucun commentaire'}"</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(entry.date).toLocaleTimeString()}</p>
                                            <p className="text-[10px] font-mono text-blue-500 mt-1">{entry.updatedBy}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 italic pl-4">Aucun historique disponible.</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <Button variant="outline" onClick={() => setViewingSub(null)}>Fermer</Button>
                </div>
            </div>
        </div>
    );
  };

  const renderSubscriptions = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800">Demandes de souscription</h2>
        
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border">
                <div className="flex items-center px-2 gap-1 text-gray-500 text-xs">
                    <Calendar size={14} />
                    Du
                </div>
                <input 
                    type="date" 
                    value={subDateStart}
                    onChange={(e) => setSubDateStart(e.target.value)}
                    className="bg-transparent text-xs border-none focus:ring-0 text-gray-700 py-1"
                />
                <div className="flex items-center px-2 gap-1 text-gray-500 text-xs border-l border-gray-200">
                    Au
                </div>
                <input 
                    type="date" 
                    value={subDateEnd}
                    onChange={(e) => setSubDateEnd(e.target.value)}
                    className="bg-transparent text-xs border-none focus:ring-0 text-gray-700 py-1"
                />
            </div>

            <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    value={subscriptionSearch}
                    onChange={(e) => setSubscriptionSearch(e.target.value)}
                    placeholder="Rechercher..." 
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-40 lg:w-60"
                />
            </div>
            <button 
                onClick={handleExportSubscriptions}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                title="Exporter en CSV"
            >
                <Download size={16} />
            </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Parcelle</th>
              <th className="px-6 py-4">Paiement</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSubscriptions.length > 0 ? filteredSubscriptions.map((sub) => {
               const parcel = parcels.find(p => p.id === sub.parcelId);
               return (
                <tr key={sub.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(sub.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{sub.userData.fullName}</div>
                    <div className="text-xs text-gray-500">{sub.userData.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded w-fit mb-1">{sub.parcelId}</div>
                    <div className="text-xs text-gray-500">{parcel?.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                      {sub.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                      ${sub.status === 'VALIDATED' ? 'bg-green-100 text-green-700 border-green-200' : 
                        sub.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                      {sub.status === 'VALIDATED' && <Check size={12} strokeWidth={3} />}
                      {sub.status === 'REJECTED' && <X size={12} strokeWidth={3} />}
                      {sub.status === 'PENDING' && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>}
                      {sub.status === 'VALIDATED' ? 'VALIDÉ' : sub.status === 'REJECTED' ? 'REJETÉ' : 'EN ATTENTE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                    <button 
                        onClick={() => setViewingSub(sub)}
                        className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition"
                        title="Voir détails et historique"
                    >
                        <Eye size={18} />
                    </button>

                    {sub.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => onUpdateSubscription(sub.id, 'VALIDATED')}
                          className="text-green-600 hover:bg-green-100 p-2 rounded-full transition" 
                          title="Valider le dossier"
                        >
                          <Check size={18} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => onUpdateSubscription(sub.id, 'REJECTED')}
                          className="text-red-600 hover:bg-red-100 p-2 rounded-full transition" 
                          title="Rejeter le dossier"
                        >
                          <X size={18} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            }) : (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                        Aucune souscription trouvée pour cette recherche.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderParcels = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800">Gestion des Parcelles</h2>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filters */}
            <select 
                value={parcelFilterCategory}
                onChange={(e) => setParcelFilterCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-gray-50 text-gray-700"
            >
                <option value="ALL">Toutes Catégories</option>
                <option value="Habitation Ordinaire">Habitation Ordinaire</option>
                <option value="Habitation Angle">Habitation Angle</option>
                <option value="Commerce Voie Non Bitumée">Commerce</option>
                <option value="Logement Social">Logement Social</option>
                <option value="Zone Industrielle">Zone Industrielle</option>
            </select>

            <select 
                value={parcelFilterStatus}
                onChange={(e) => setParcelFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-gray-50 text-gray-700"
            >
                <option value="ALL">Tous Statuts</option>
                <option value="AVAILABLE">Disponible</option>
                <option value="RESERVED">Réservé</option>
                <option value="SOLD">Vendu</option>
            </select>

            <button 
                onClick={handleExportParcels}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                title="Exporter en CSV"
            >
                <FileSpreadsheet size={18} />
            </button>

            <Button 
                variant="primary" 
                className="text-xs py-2 px-3 flex items-center gap-2"
                onClick={() => { setIsEditingMode(false); setIsAddingParcel(true); setNewParcel({ id: '', category: 'Habitation Ordinaire', area: 300, pricePerM2: 5000, totalPrice: 1500000, subscriptionFee: 50000, description: '', status: 'AVAILABLE' }); }}
            >
                <Plus size={16} /> Ajouter
            </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Catégorie</th>
              <th className="px-6 py-4">Surface</th>
              <th className="px-6 py-4">Prix Total</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredParcels.length > 0 ? filteredParcels.map((parcel) => (
              <tr key={parcel.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono text-xs font-bold text-gray-600">{parcel.id}</td>
                <td className="px-6 py-4 font-medium">{parcel.category}</td>
                <td className="px-6 py-4">{parcel.area} m²</td>
                <td className="px-6 py-4">{parcel.totalPrice.toLocaleString()} FCFA</td>
                <td className="px-6 py-4">
                  <select 
                    value={parcel.status}
                    onChange={(e) => onUpdateParcel({...parcel, status: e.target.value as any})}
                    className={`text-xs font-bold border rounded px-2 py-1 cursor-pointer focus:ring-2 focus:ring-green-500 outline-none transition
                      ${parcel.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 border-green-200' : 
                        parcel.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                  >
                    <option value="AVAILABLE">DISPONIBLE</option>
                    <option value="RESERVED">RÉSERVÉ</option>
                    <option value="SOLD">VENDU</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button 
                        onClick={() => openEditModal(parcel)}
                        className="text-gray-400 hover:text-green-600 transition p-2 hover:bg-green-50 rounded-full"
                        title="Modifier"
                    >
                        <Edit size={16} />
                    </button>
                    <button 
                        onClick={() => setParcelToDelete(parcel)}
                        className="text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full"
                        title="Supprimer"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                        Aucune parcelle ne correspond aux filtres sélectionnés.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Delete Confirmation Modal
  const renderDeleteModal = () => {
      if (!parcelToDelete) return null;
      return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-6 border-b border-red-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                <Trash2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Supprimer la parcelle ?</h3>
              <p className="text-sm text-gray-600 mt-1">Cette action est irréversible.</p>
            </div>
            
            <div className="p-6 text-center space-y-2">
               <p className="text-gray-700">Vous êtes sur le point de supprimer :</p>
               <p className="font-mono font-bold text-lg bg-gray-100 py-2 rounded">{parcelToDelete.id}</p>
               <p className="text-xs text-gray-500 mt-2">
                  Si des souscriptions sont liées à cette parcelle, elles risquent d'être corrompues.
               </p>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3">
               <Button 
                 variant="outline" 
                 onClick={() => setParcelToDelete(null)}
                 className="flex-1"
               >
                 Annuler
               </Button>
               <Button 
                 variant="danger" 
                 onClick={() => { onDeleteParcel(parcelToDelete.id); setParcelToDelete(null); }}
                 className="flex-1"
               >
                 Confirmer la suppression
               </Button>
            </div>
          </div>
        </div>
      );
  };

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
                <p>Les nouvelles parcelles seront immédiatement visibles sur la plateforme client si le statut est défini sur "Disponible".</p>
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
                {!isEditingMode && <p className="text-xs text-gray-400 mt-1">Format: Lettres majuscules, chiffres et tirets (-) uniquement.</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select 
                  value={newParcel.category}
                  onChange={(e) => setNewParcel({...newParcel, category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Habitation Ordinaire">Habitation Ordinaire</option>
                  <option value="Habitation Angle">Habitation Angle</option>
                  <option value="Commerce Voie Non Bitumée">Commerce</option>
                  <option value="Logement Social">Logement Social</option>
                  <option value="Zone Industrielle">Zone Industrielle</option>
                </select>
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
                  type="number" 
                  value={newParcel.area}
                  onChange={(e) => setNewParcel({...newParcel, area: Number(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix Unitaire (FCFA/m²)</label>
                <input 
                  type="number" 
                  value={newParcel.pricePerM2}
                  onChange={(e) => setNewParcel({...newParcel, pricePerM2: Number(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-1 rounded inline-block">
                   Soit: {newParcel.pricePerM2.toLocaleString()} FCFA
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix Total (Calculé)</label>
                <input 
                  type="number" 
                  value={newParcel.totalPrice}
                  readOnly
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 font-bold text-gray-700 cursor-not-allowed"
                />
                <div className="text-xs text-green-600 mt-1 font-mono font-bold">
                   Soit: {newParcel.totalPrice.toLocaleString()} FCFA
                </div>
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frais de dossier (FCFA)</label>
                <input 
                  type="number" 
                  value={newParcel.subscriptionFee}
                  onChange={(e) => setNewParcel({...newParcel, subscriptionFee: Number(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                 <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-1 rounded inline-block">
                   Soit: {newParcel.subscriptionFee.toLocaleString()} FCFA
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Localisation</label>
                <textarea 
                  value={newParcel.description}
                  onChange={(e) => setNewParcel({...newParcel, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Ex: Section A, Lot 12, face école..."
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
            <Button variant="outline" onClick={() => setIsAddingParcel(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleSaveParcel}>{isEditingMode ? 'Enregistrer les modifications' : 'Créer la parcelle'}</Button>
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
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
              ${activeTab === 'dashboard' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            Tableau de bord
          </button>
          
          <button 
            onClick={() => setActiveTab('subscriptions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
              ${activeTab === 'subscriptions' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            Souscriptions
          </button>
          
          <button 
            onClick={() => setActiveTab('parcels')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
              ${activeTab === 'parcels' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Map size={20} />
            Parcelles
          </button>

          <div className="pt-8 mt-8 border-t border-slate-800">
             <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2">Système</p>
             <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
                <Settings size={20} />
                Configuration
             </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition text-sm"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto relative h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'dashboard' ? 'Vue d\'ensemble' : 
               activeTab === 'subscriptions' ? 'Gestion des Souscriptions' : 'Parc Foncier'}
            </h2>
            <p className="text-sm text-gray-500">Bienvenue sur votre espace d'administration sécurisé.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-700">Administrateur</p>
                <p className="text-xs text-gray-400">Direction Commerciale</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shadow-sm border border-green-200">AD</div>
          </div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'subscriptions' && renderSubscriptions()}
        {activeTab === 'parcels' && renderParcels()}
        
        {/* Modals */}
        {renderAddParcelModal()}
        {renderSubscriptionDetailsModal()}
        {renderDeleteModal()}
      </main>
    </div>
  );
};

export default AdminPanel;
