import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getUsers } from '@/services/supabase'; // <--- CHANGÉ (Supabase)
import type { UserProfile } from '@/types/schema';
import { UserTable } from '@/features/users/UserTable';
import { Input } from '@/components/ui/input';

export const UsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    const result = users.filter(u => 
      u.fullName.toLowerCase().includes(lower) || u.matricule.toLowerCase().includes(lower)
    );
    setFilteredUsers(result);
  }, [search, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await getUsers();
    setUsers(data);
    setFilteredUsers(data);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Student Directory</h1></div>
        <div className="relative w-64">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-10" />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>
      <UserTable users={filteredUsers} isLoading={isLoading} />
    </div>
  );
};