import { Megaphone } from 'lucide-react';
import { BroadcastForm } from '@/features/notifications/BroadcastForm';

export const NotificationsPage = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Megaphone className="text-orange-500" /> Notifications Center
        </h1>
        <p className="text-gray-500">Send push alerts and manage global announcements.</p>
      </div>

      <BroadcastForm />
      
      <div className="bg-white p-6 rounded-xl border border-gray-200">
         <h3 className="font-bold text-gray-800 mb-2">Message History</h3>
         <p className="text-gray-400 text-sm">To view past sent messages, check the 'adminLogs' collection in the Firebase Console.</p>
      </div>
    </div>
  );
};