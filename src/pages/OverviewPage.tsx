import { useEffect, useState } from 'react';
import { Users, BookOpen, Building2, MapPin } from 'lucide-react';
import { getCollectionCount } from '@/services/supabase'; // <--- CHANGÉ (Supabase)

export const OverviewPage = () => {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    faculties: 0,
    venues: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      // Utilisation de la méthode optimisée de Supabase (COUNT sans récupérer les données)
      const [u, c, f, v] = await Promise.all([
        getCollectionCount('users'),
        getCollectionCount('courses'),
        getCollectionCount('faculties'),
        getCollectionCount('venues')
      ]);
      setStats({
        users: u,
        courses: c,
        faculties: f,
        venues: v
      });
      setLoading(false);
    };
    loadStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
      <div className={`p-4 rounded-full ${color} text-white`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">
          {loading ? '...' : value}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, Admin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.users} icon={Users} color="bg-blue-600" />
        <StatCard title="Active Courses" value={stats.courses} icon={BookOpen} color="bg-purple-600" />
        <StatCard title="Faculties" value={stats.faculties} icon={Building2} color="bg-orange-500" />
        <StatCard title="Venues" value={stats.venues} icon={MapPin} color="bg-emerald-500" />
      </div>

      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">System Status</h3>
        <div className="flex justify-center items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-green-700 font-medium">All Systems Operational</span>
        </div>
      </div>
    </div>
  );
};