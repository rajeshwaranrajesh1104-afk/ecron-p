import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { EventRegistration, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isRegistered: boolean;
  loading: boolean;
  signUp: (registrationData: Omit<EventRegistration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkRegistrationStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRegistrationStatus();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkRegistrationStatus();
      } else {
        setUserProfile(null);
        setIsRegistered(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRegistrationStatus = async () => {
    if (!user) return;

    try {
      // Check if user has a profile and registration
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*, event_registrations(*)')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profile) {
        setUserProfile(profile);
        setIsRegistered(profile.is_registered && profile.event_registrations?.length > 0);
      } else {
        setUserProfile(null);
        setIsRegistered(false);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
      setUserProfile(null);
      setIsRegistered(false);
    }
  };

  const signUp = async (registrationData: Omit<EventRegistration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email_id,
        password: registrationData.certificate_code, // Using certificate code as password
        options: {
          data: {
            name: registrationData.name,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: registrationData.email_id,
          name: registrationData.name,
          is_registered: true,
        });

      if (profileError) throw profileError;

      // Create event registration
      const { data: registration, error: registrationError } = await supabase
        .from('event_registrations')
        .insert({
          user_id: authData.user.id,
          ...registrationData,
        })
        .select()
        .single();

      if (registrationError) throw registrationError;

      // Update profile with registration ID
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ registration_id: registration.id })
        .eq('id', authData.user.id);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    userProfile,
    isRegistered,
    loading,
    signUp,
    signIn,
    signOut,
    checkRegistrationStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};