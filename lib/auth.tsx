"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "resident" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  rfidUid?: string;
  balance: number;
  avatar?: string;
}

// Lightweight hook for pages that need the full profile (balance, rfidUid, etc.)
// Auth guarding is handled by LayoutShell — this is just for data.
export function useProfile() {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data } = await supabase
      .from("jeepneyriders")
      .select("id, full_name, email, role, balance, rfid_uid, avatar")
      .eq("id", session.user.id)
      .single();

    if (data) {
      setUser({
        id:      data.id,
        name:    data.full_name,
        email:   data.email,
        role:    data.role,
        balance: data.balance ?? 0,
        rfidUid: data.rfid_uid ?? undefined,
        avatar:  data.avatar ?? undefined,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, refreshProfile: fetchProfile };
}

// Keep useAuth as an alias so existing page components don't need changes
export function useAuth() {
  const { user, loading, refreshProfile } = useProfile();

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const login = async (email: string, password: string): Promise<Role | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return null;
    return (data.session.user.user_metadata?.role ?? "resident") as Role;
  };

  const signup = async (name: string, email: string, password: string, role: Role): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role } },
    });
    if (error || !data.user) return false;

    const { error: dbErr } = await supabase.from("jeepneyriders").insert({
      id: data.user.id, full_name: name, email, role, balance: 0, rfid_uid: null, avatar: null,
    });
    if (dbErr) { await supabase.auth.signOut(); return false; }
    return true;
  };

  return { user, loading, login, logout, signup, refreshProfile };
}
