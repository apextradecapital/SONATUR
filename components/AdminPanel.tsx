
import React, { useState, useEffect } from 'react';
import { ParcelType, SubscriptionRecord, SystemSettings } from '../types';
import { LayoutDashboard, Users, Map, Settings, LogOut, Save, Smartphone, FileText, Percent, Clock } from 'lucide-react';
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

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  settings,
  onUpdateSettings,
  onLogout
}) => {
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => { setLocalSettings(settings); }, [settings]);

  const handleSave = () => {
      onUpdateSettings(localSettings);
      alert('Paramètres mis à jour !');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
       <aside className="w-full md:w-64 bg-[#009640] text-white p-6">
          <h1 className="font-bold text-2xl mb-8">ADMIN SONATUR</h1>
          <nav className="space-y-2">
             <button onClick={() => setActiveTab('settings')} className="flex items-center gap-2 w-full p-3 bg-white/10 rounded">
                <Settings size={20} /> Configuration
             </button>
             <button onClick={onLogout} className="flex items-center gap-2 w-full p-3 hover:bg-white/10 rounded mt-auto text-red-200">
                <LogOut size={20} /> Déconnexion
             </button>
          </nav>
       </aside>
       
       <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FileText className="text-[#009640]" /> Textes & Conditions
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Conditions Générales (Texte complet)</label>
                        <textarea 
                            value={localSettings.conditionsText}
                            onChange={(e) => setLocalSettings({...localSettings, conditionsText: e.target.value})}
                            rows={10}
                            className="w-full p-3 border rounded-lg text-sm font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Message d'avertissement (Paiement)</label>
                        <input 
                            type="text" 
                            value={localSettings.paymentWarningText}
                            onChange={(e) => setLocalSettings({...localSettings, paymentWarningText: e.target.value})}
                            className="w-full p-3 border rounded-lg"
                        />
                    </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Percent className="text-blue-600" /> Paramètres Financiers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Acompte Habitation (%)</label>
                        <input 
                            type="number" 
                            value={localSettings.depositPercentHousing}
                            onChange={(e) => setLocalSettings({...localSettings, depositPercentHousing: Number(e.target.value)})}
                            className="w-full p-3 border rounded-lg font-bold text-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Acompte Commerce (%)</label>
                        <input 
                            type="number" 
                            value={localSettings.depositPercentCommercial}
                            onChange={(e) => setLocalSettings({...localSettings, depositPercentCommercial: Number(e.target.value)})}
                            className="w-full p-3 border rounded-lg font-bold text-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Timer Paiement (min)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={localSettings.timerDurationMinutes}
                                onChange={(e) => setLocalSettings({...localSettings, timerDurationMinutes: Number(e.target.value)})}
                                className="w-full p-3 border rounded-lg font-bold text-lg pl-10"
                            />
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Smartphone className="text-orange-500" /> Orange Money (Instructions)
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                         <label className="block text-sm font-bold text-gray-700">Code USSD</label>
                         <input value={localSettings.orangeMoney.ussdCode} onChange={e => setLocalSettings({...localSettings, orangeMoney: {...localSettings.orangeMoney, ussdCode: e.target.value}})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                         <label className="block text-sm font-bold text-gray-700">Numéro Bénéficiaire</label>
                         <input value={localSettings.orangeMoney.merchantCode} onChange={e => setLocalSettings({...localSettings, orangeMoney: {...localSettings.orangeMoney, merchantCode: e.target.value}})} className="w-full p-2 border rounded" />
                    </div>
                    <div className="col-span-2">
                         <label className="block text-sm font-bold text-gray-700">Étapes (une par ligne)</label>
                         <textarea 
                            value={localSettings.orangeMoney.steps.join('\n')} 
                            onChange={e => setLocalSettings({...localSettings, orangeMoney: {...localSettings.orangeMoney, steps: e.target.value.split('\n')}})} 
                            className="w-full p-2 border rounded font-mono text-sm"
                            rows={5}
                         />
                    </div>
                </div>
             </div>

             <div className="flex justify-end sticky bottom-6">
                <Button onClick={handleSave} className="bg-[#009640] shadow-xl text-lg px-8 py-3">
                    <Save className="mr-2" /> Enregistrer les modifications
                </Button>
             </div>
          </div>
       </main>
    </div>
  );
};

export default AdminPanel;
