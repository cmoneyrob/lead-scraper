"use client";

import { useCallback, useEffect, useState } from "react";

export interface Lead {
  id: string;
  company_name: string;
  domain: string | null;
  url: string | null;
  title: string | null;
  description: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_linkedin: string | null;
  status: "new" | "contacted" | "qualified" | "unqualified" | "converted" | "lost";
  pipeline_stage: "discovery" | "research" | "outreach" | "negotiation" | "closed_won" | "closed_lost";
  total_score: number;
  qualified: boolean;
  enrichment_data: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_scored_at: string | null;
  tags?: { id: string; name: string; color: string }[];
  signal_results?: SignalResult[];
}

export interface SignalResult {
  id: string;
  signal_definition_id: string;
  matched: boolean;
  raw_score: number;
  weighted_score: number;
  match_details: Record<string, unknown> | null;
  evaluated_at: string;
  signal_definition?: {
    name: string;
    signal_type: string;
    category: string | null;
  };
}

export interface LeadFilters {
  status?: string;
  pipeline_stage?: string;
  qualified?: boolean;
  min_score?: number;
  max_score?: number;
  tag_id?: string;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  per_page: number;
}

export function useLeads(initialFilters?: LeadFilters) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeadFilters>(initialFilters ?? { page: 1, per_page: 25, sort_by: "created_at", sort_order: "desc" });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data: LeadsResponse = await res.json();
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateFilters = useCallback((newFilters: Partial<LeadFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: newFilters.page ?? 1 }));
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete lead");
    await fetchLeads();
  }, [fetchLeads]);

  const updateLead = useCallback(async (id: string, data: Partial<Lead>) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update lead");
    await fetchLeads();
  }, [fetchLeads]);

  const bulkAction = useCallback(async (leadIds: string[], action: string, payload?: Record<string, unknown>) => {
    const res = await fetch("/api/leads/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_ids: leadIds, action, payload }),
    });
    if (!res.ok) throw new Error("Failed to perform bulk action");
    await fetchLeads();
  }, [fetchLeads]);

  return { leads, total, loading, error, filters, updateFilters, fetchLeads, deleteLead, updateLead, bulkAction };
}

export function useLead(id: string) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      setLead(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  return { lead, loading, error, refetch: fetchLead };
}
