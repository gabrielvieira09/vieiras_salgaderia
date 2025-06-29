"use client";

import type React from "react";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  neighborhood: string;
  number: string;
  cep: string;
  isAdmin: boolean;
  purchases: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<boolean>;
  addPurchase: (productId: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      if (error) {
        console.error("Error loading user profile:", error);
        return;
      }

      if (profile) {
        const userData: User = {
          id: profile.user_id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || "",
          street: profile.street || "",
          neighborhood: profile.neighborhood || "",
          number: profile.number || "",
          cep: profile.cep || "",
          isAdmin: profile.is_admin || false,
          purchases: profile.purchases || [],
        };

        setUser(userData);

        if(profile.is_admin){
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user);
        return true;
      }

      return false;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Clear any localStorage cart data on logout
      try {
        localStorage.removeItem('vieiras_guest_cart');
      } catch (storageError) {
        console.error("Error clearing cart storage:", storageError);
      }
      
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setLoading(true);
      
      // 1. Create user in auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error || !data.user) {
        console.error("Registration error:", error);
        return false;
      }

      const userId = data.user.id;

      // 2. Create profile in profiles table
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || "",
        street: userData.street || "",
        neighborhood: userData.neighborhood || "",
        number: userData.number || "",
        cep: userData.cep || "",
        is_admin: false,
        purchases: [],
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        return false;
      }

      // 3. Load the user profile
      await loadUserProfile(data.user);

      return true;
    } catch (err) {
      console.error("Registration error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addPurchase = async (productId: string): Promise<void> => {
    if (!user) return;

    try {
      const updatedPurchases = [...(user.purchases || []), productId];
      
      // Update in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({ purchases: updatedPurchases })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error adding purchase:", error);
        return;
      }

      // Update local state
      const updatedUser = {
        ...user,
        purchases: updatedPurchases,
      };
      setUser(updatedUser);
    } catch (error) {
      console.error("Error adding purchase:", error);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      // Update in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          name: userData.name || user.name,
          email: userData.email || user.email,
          phone: userData.phone || user.phone,
          street: userData.street || user.street,
          neighborhood: userData.neighborhood || user.neighborhood,
          number: userData.number || user.number,
          cep: userData.cep || user.cep,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        return false;
      }

      // Update local state
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        register, 
        addPurchase, 
        updateProfile 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
