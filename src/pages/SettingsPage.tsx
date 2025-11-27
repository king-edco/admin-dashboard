import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, AlertTriangle, Smartphone, Power, Megaphone, CheckCircle, Clock } from 'lucide-react';
import { getAppConfig, updateAppConfig } from '@/services/supabase'; // <--- CHANGÉ (Supabase)
import type { AppConfig } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const SettingsPage = () => {
  const { register, handleSubmit, setValue, watch } = useForm<AppConfig>();
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isMaintenance = watch('maintenanceMode');
  const currentMode = watch('currentMode');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const config = await getAppConfig();
    if (config) {
      setValue('currentMode', config.currentMode);
      setValue('maintenanceMode', config.maintenanceMode);
      setValue('announcement', config.announcement);
      setValue('minVersion', config.minVersion);
    }
  };

  const onSubmit = async (data: AppConfig) => {
    setIsLoading(true);
    await updateAppConfig(data);
    setSuccessMsg('Settings updated successfully!');
    setIsLoading(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Smartphone className="text-blue-600" /> App Configuration
        </h1>
        <p className="text-gray-500 mt-1">Global settings affecting all mobile users.</p>
      </div>

      {successMsg && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Academic Mode */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-purple-600" /> Academic Mode
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Determines which timetable is shown by default.
            </p>
            <div className="space-y-2">
              {(['lecture', 'ca', 'exam'] as const).map((m) => (
                <label key={m} className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${currentMode === m ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'hover:bg-gray-50'}`}>
                  <input type="radio" value={m} {...register('currentMode')} className="h-4 w-4 text-purple-600" />
                  <span className="ml-2 font-medium capitalize">{m} Period</span>
                </label>
              ))}
            </div>
        </div>

        {/* Maintenance Mode */}
        <div className={`p-6 rounded-xl shadow-sm border border-gray-200 transition ${isMaintenance ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Power size={18} className={isMaintenance ? 'text-red-600' : 'text-gray-600'} /> System Status
            </h3>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">Maintenance Mode</span>
              <input type="checkbox" {...register('maintenanceMode')} className="h-6 w-6 accent-red-600" />
            </div>
            <p className="text-sm text-gray-500">
              When enabled, users will see a "Under Maintenance" screen.
              <span className="block mt-2 font-bold text-red-600 flex items-center gap-1">
                {isMaintenance ? <><AlertTriangle size={14} /> APP LOCKED</> : "App Online"}
              </span>
            </p>
        </div>

        {/* Announcement */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Megaphone size={18} className="text-orange-500" /> Global Announcement
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Message</label>
              <Input {...register('announcement')} placeholder="Exams start on Monday!" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min App Version</label>
              <Input {...register('minVersion')} placeholder="1.0.0" className="w-32" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? 'Saving...' : <><Save size={20} className="mr-2" /> Save Configuration</>}
          </Button>
        </div>
      </form>
    </div>
  );
};