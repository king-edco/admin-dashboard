import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Vérifier la session actuelle au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminRole(session?.user);
      setIsLoading(false);
    });

    // 2. Écouter les changements (Connexion / Déconnexion)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminRole(session?.user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Vérification du rôle Admin stocké dans les métadonnées
  const checkAdminRole = (currentUser: User | undefined | null) => {
    if (currentUser && currentUser.user_metadata?.role === 'admin') {
      setIsAdmin(true);
    } else {
      // Cas spécial : Ton email Super Admin codé en dur pour le premier accès
      if (currentUser?.email === 'logamaxime@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);