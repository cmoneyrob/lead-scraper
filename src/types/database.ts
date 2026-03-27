export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "unqualified"
  | "converted"
  | "lost";

export type PipelineStage =
  | "discovery"
  | "research"
  | "outreach"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type SignalType =
  | "keyword"
  | "regex"
  | "technology"
  | "social_presence"
  | "domain_age"
  | "page_metric"
  | "composite"
  | "custom_expression";

export type SearchJobStatus = "pending" | "running" | "completed" | "failed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          domain: string | null;
          url: string | null;
          title: string | null;
          description: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          contact_linkedin: string | null;
          status: LeadStatus;
          pipeline_stage: PipelineStage;
          total_score: number;
          qualified: boolean;
          qualification_threshold: number | null;
          raw_search_result: Record<string, unknown> | null;
          enrichment_data: Record<string, unknown> | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          last_scored_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          domain?: string | null;
          url?: string | null;
          title?: string | null;
          description?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_linkedin?: string | null;
          status?: LeadStatus;
          pipeline_stage?: PipelineStage;
          total_score?: number;
          qualified?: boolean;
          qualification_threshold?: number | null;
          raw_search_result?: Record<string, unknown> | null;
          enrichment_data?: Record<string, unknown> | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          last_scored_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          domain?: string | null;
          url?: string | null;
          title?: string | null;
          description?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_linkedin?: string | null;
          status?: LeadStatus;
          pipeline_stage?: PipelineStage;
          total_score?: number;
          qualified?: boolean;
          qualification_threshold?: number | null;
          raw_search_result?: Record<string, unknown> | null;
          enrichment_data?: Record<string, unknown> | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          last_scored_at?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      lead_tags: {
        Row: {
          lead_id: string;
          tag_id: string;
        };
        Insert: {
          lead_id: string;
          tag_id: string;
        };
        Update: {
          lead_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      signal_definitions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          signal_type: SignalType;
          config: Record<string, unknown>;
          weight: number;
          max_score: number;
          category: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          signal_type: SignalType;
          config?: Record<string, unknown>;
          weight?: number;
          max_score?: number;
          category?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          signal_type?: SignalType;
          config?: Record<string, unknown>;
          weight?: number;
          max_score?: number;
          category?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      signal_results: {
        Row: {
          id: string;
          lead_id: string;
          signal_definition_id: string;
          matched: boolean;
          raw_score: number;
          weighted_score: number;
          match_details: Record<string, unknown> | null;
          evaluated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          signal_definition_id: string;
          matched?: boolean;
          raw_score?: number;
          weighted_score?: number;
          match_details?: Record<string, unknown> | null;
          evaluated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          signal_definition_id?: string;
          matched?: boolean;
          raw_score?: number;
          weighted_score?: number;
          match_details?: Record<string, unknown> | null;
          evaluated_at?: string;
        };
        Relationships: [];
      };
      scoring_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          qualification_threshold: number;
          signal_ids: string[];
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          qualification_threshold?: number;
          signal_ids?: string[];
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          qualification_threshold?: number;
          signal_ids?: string[];
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      search_jobs: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          search_params: Record<string, unknown>;
          scoring_profile_id: string | null;
          status: SearchJobStatus;
          results_count: number;
          leads_created: number;
          error_message: string | null;
          results_data: Record<string, unknown> | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          search_params?: Record<string, unknown>;
          scoring_profile_id?: string | null;
          status?: SearchJobStatus;
          results_count?: number;
          leads_created?: number;
          error_message?: string | null;
          results_data?: Record<string, unknown> | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          query?: string;
          search_params?: Record<string, unknown>;
          scoring_profile_id?: string | null;
          status?: SearchJobStatus;
          results_count?: number;
          leads_created?: number;
          error_message?: string | null;
          results_data?: Record<string, unknown> | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lead_status: LeadStatus;
      pipeline_stage: PipelineStage;
      signal_type: SignalType;
      search_job_status: SearchJobStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
