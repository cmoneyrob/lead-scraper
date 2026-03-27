"use client";

import { useCallback, useEffect, useState } from "react";

export interface SignalDefinition {
  id: string;
  name: string;
  description: string | null;
  signal_type: string;
  config: Record<string, unknown>;
  weight: number;
  max_score: number;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScoringProfile {
  id: string;
  name: string;
  description: string | null;
  qualification_threshold: number;
  signal_ids: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useSignals() {
  const [signals, setSignals] = useState<SignalDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/signals");
      if (!res.ok) throw new Error("Failed to fetch signals");
      const data = await res.json();
      setSignals(data.signals ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  const createSignal = useCallback(async (data: Partial<SignalDefinition>): Promise<SignalDefinition> => {
    const res = await fetch("/api/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create signal");
    const signal = await res.json();
    await fetchSignals();
    return signal;
  }, [fetchSignals]);

  const updateSignal = useCallback(async (id: string, data: Partial<SignalDefinition>) => {
    const res = await fetch(`/api/signals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update signal");
    await fetchSignals();
  }, [fetchSignals]);

  const deleteSignal = useCallback(async (id: string) => {
    const res = await fetch(`/api/signals/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete signal");
    await fetchSignals();
  }, [fetchSignals]);

  const testSignal = useCallback(async (signalId: string, leadId: string) => {
    const res = await fetch(`/api/signals/${signalId}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId }),
    });
    if (!res.ok) throw new Error("Failed to test signal");
    return res.json();
  }, []);

  return { signals, loading, error, fetchSignals, createSignal, updateSignal, deleteSignal, testSignal };
}

export function useScoringProfiles() {
  const [profiles, setProfiles] = useState<ScoringProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scoring-profiles");
      if (!res.ok) throw new Error("Failed to fetch profiles");
      const data = await res.json();
      setProfiles(data.profiles ?? data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const createProfile = useCallback(async (data: Partial<ScoringProfile>) => {
    const res = await fetch("/api/scoring-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create profile");
    await fetchProfiles();
    return res.json();
  }, [fetchProfiles]);

  const updateProfile = useCallback(async (id: string, data: Partial<ScoringProfile>) => {
    const res = await fetch(`/api/scoring-profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    await fetchProfiles();
  }, [fetchProfiles]);

  const deleteProfile = useCallback(async (id: string) => {
    const res = await fetch(`/api/scoring-profiles/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete profile");
    await fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, fetchProfiles, createProfile, updateProfile, deleteProfile };
}
