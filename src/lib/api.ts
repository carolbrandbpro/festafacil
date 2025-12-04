const base = import.meta.env.VITE_API_URL || "";
import { supabase } from "./supabase";

const url = (path: string) => (base ? `${base}${path}` : path);

export async function getArrivals(): Promise<Record<string, boolean>> {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("arrivals").select("id, arrived");
      if (error) throw error;
      const out: Record<string, boolean> = {};
      for (const row of data || []) out[row.id] = !!row.arrived;
      return out;
    }
    const res = await fetch(url("/api/arrivals"));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {};
  }
}

export async function setArrived(id: string, arrived: boolean): Promise<void> {
  try {
    if (supabase) {
      const { error } = await supabase.from("arrivals").upsert({ id, arrived }, { onConflict: "id" });
      if (error) throw error;
      return;
    }
    await fetch(url(`/api/guests/${id}/arrived`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arrived }),
    });
  } catch {
    return;
  }
}

export async function getStore<T>(key: string): Promise<T | null> {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("store").select("value").eq("key", key).limit(1).maybeSingle();
      if (error) return null;
      return (data?.value as T) ?? null;
    }
    const res = await fetch(url(`/api/store/${encodeURIComponent(key)}`));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function setStore<T>(key: string, value: T): Promise<boolean> {
  try {
    if (supabase) {
      const { error } = await supabase.from("store").upsert({ key, value }, { onConflict: "key" });
      if (error) return false;
      return true;
    }
    const res = await fetch(url(`/api/store/${encodeURIComponent(key)}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

