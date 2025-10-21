import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LandParcel = {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  size_hectares: number;
  owner_id: string;
  land_use_type: string;
  created_at: string;
};

export type SoilHealthRecord = {
  id: string;
  parcel_id: string;
  vitality_score: number;
  ph_level: number | null;
  moisture_level: number | null;
  nitrogen_level: number | null;
  phosphorus_level: number | null;
  potassium_level: number | null;
  organic_matter: number | null;
  temperature: number | null;
  data_source: string;
  recorded_at: string;
  created_at: string;
};

export type RestorationActivity = {
  id: string;
  parcel_id: string;
  activity_type: string;
  description: string;
  quantity: number;
  unit: string;
  performed_by: string;
  blockchain_hash: string | null;
  verification_status: string;
  carbon_offset_kg: number;
  performed_at: string;
  verified_at: string | null;
  created_at: string;
};

export type Recommendation = {
  id: string;
  parcel_id: string;
  recommendation_type: string;
  title: string;
  description: string;
  priority: string;
  estimated_cost: number;
  expected_impact: string | null;
  status: string;
  ai_confidence: number | null;
  created_at: string;
  implemented_at: string | null;
};

export type DegradationAlert = {
  id: string;
  parcel_id: string;
  alert_type: string;
  severity: string;
  message: string;
  recommended_action: string | null;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
};

export type UserProfile = {
  id: string;
  full_name: string;
  role: string;
  organization: string;
  impact_points: number;
  badges: string[];
  created_at: string;
  updated_at: string;
};
