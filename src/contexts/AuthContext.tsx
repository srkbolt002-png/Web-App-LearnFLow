import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin' | 'super_admin' | 'department_admin';
  avatar?: string;
  bio?: string;
  departmentId?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  loginWithStudentId: (studentId: string, password: string) => Promise<{ error: string | null }>;
  signup: (name: string, email: string, password: string, role?: 'student' | 'instructor') => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, just set loading to false
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(() => loadUserProfile(session.user), 0);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser) => {
    if (!supabase) return;
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id);

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
      }

      const userRole = roles?.[0]?.role || 'student';

      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: userRole,
          avatar: profile.avatar,
          bio: profile.bio,
          departmentId: profile.department_id,
        });
      } else {
        console.warn('Profile not found for user:', authUser.id);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Authentication is not configured. Please enable Lovable Cloud.' };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error?.message || null };
  };

  const loginWithStudentId = async (studentId: string, password: string) => {
    if (!supabase) {
      return { error: 'Authentication is not configured. Please enable Lovable Cloud.' };
    }
    
    try {
      // Look up email from student_id
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('student_id', studentId)
        .maybeSingle();
      
      if (lookupError) {
        console.error('Error looking up student ID:', lookupError);
        return { error: 'Failed to find student. Please contact your department admin.' };
      }
      
      if (!profile || !profile.email) {
        return { error: 'Student ID not found. Please check your ID or contact your department admin.' };
      }
      
      // Login with the found email
      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });
      
      return { error: error?.message || null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: 'An error occurred during login' };
    }
  };

  const signup = async (name: string, email: string, password: string, role: 'student' | 'instructor' = 'student') => {
    if (!supabase) {
      return { error: 'Authentication is not configured. Please enable Lovable Cloud.' };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name,
        }
      }
    });

    if (error) {
      return { error: error.message };
    }

    // Add role if not default student
    if (data.user && role !== 'student') {
      await supabase.from('user_roles').delete().eq('user_id', data.user.id);
      await supabase.from('user_roles').insert({ user_id: data.user.id, role });
    }
    
    return { error: null };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user || !supabase) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        avatar: updates.avatar,
        bio: updates.bio,
      })
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, loginWithStudentId, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
