/**
 * Database type definitions for Supabase.
 *
 * These are hand-written to match the migrations in supabase/migrations/.
 * Once the project is live, replace with auto-generated types:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StatutAnalyse = "brouillon" | "en_cours" | "finalisee";
export type CriteriaType = "select" | "checkbox" | "threshold" | "additive";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          is_super_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          is_super_admin?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      scoring_criteria: {
        Row: {
          id: string;
          phase: 1 | 2 | 3;
          key: string;
          label: string;
          type: CriteriaType;
          weight: number;
          config: Json | null;
          sort_order: number;
          active: boolean;
        };
        Insert: {
          id?: string;
          phase: 1 | 2 | 3;
          key: string;
          label: string;
          type: CriteriaType;
          weight?: number;
          config?: Json | null;
          sort_order?: number;
          active?: boolean;
        };
        Update: {
          phase?: 1 | 2 | 3;
          key?: string;
          label?: string;
          type?: CriteriaType;
          weight?: number;
          config?: Json | null;
          sort_order?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      scoring_options: {
        Row: {
          id: string;
          criteria_id: string;
          key: string;
          label: string;
          score: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          criteria_id: string;
          key: string;
          label: string;
          score: number;
          sort_order?: number;
        };
        Update: {
          key?: string;
          label?: string;
          score?: number;
          sort_order?: number;
        };
        Relationships: [];
      };

      fonciers: {
        Row: {
          id: string;
          nom: string;
          adresse: string | null;
          ville: string | null;
          departement: string | null;
          ref_cadastrale: string | null;
          surface_m2: number | null;
          prix_acquisition: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          adresse?: string | null;
          ville?: string | null;
          departement?: string | null;
          ref_cadastrale?: string | null;
          surface_m2?: number | null;
          prix_acquisition?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nom?: string;
          adresse?: string | null;
          ville?: string | null;
          departement?: string | null;
          ref_cadastrale?: string | null;
          surface_m2?: number | null;
          prix_acquisition?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      analyses: {
        Row: {
          id: string;
          foncier_id: string;
          statut: StatutAnalyse;
          scores_calcules: Json;
          pre_bilan: Json | null;
          cree_par: string;
          modifie_par: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          foncier_id: string;
          statut?: StatutAnalyse;
          scores_calcules?: Json;
          pre_bilan?: Json | null;
          cree_par: string;
          modifie_par?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          statut?: StatutAnalyse;
          scores_calcules?: Json;
          pre_bilan?: Json | null;
          modifie_par?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      analyse_reponses: {
        Row: {
          id: string;
          analyse_id: string;
          critere_id: string;
          valeur: Json;
          score_obtenu: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analyse_id: string;
          critere_id: string;
          valeur: Json;
          score_obtenu?: number | null;
          created_at?: string;
        };
        Update: {
          valeur?: Json;
          score_obtenu?: number | null;
        };
        Relationships: [];
      };
      analyse_historique: {
        Row: {
          id: string;
          analyse_id: string;
          modifie_par: string;
          champ_modifie: string;
          valeur_avant: Json | null;
          valeur_apres: Json | null;
          modified_at: string;
        };
        // Insert/Update forbidden by RLS — only the Postgres trigger can write
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      statut_analyse: StatutAnalyse;
      criteria_type: CriteriaType;
    };
    CompositeTypes: Record<string, never>;
  };
};
