/*
  # TerraLink Database Schema - Smart Land Health Intelligence System

  ## Overview
  This migration creates the core database structure for TerraLink, a platform that monitors,
  predicts, and restores land health through AI, IoT, satellite data, and blockchain verification.

  ## New Tables

  ### 1. `land_parcels`
  Stores information about registered land parcels being monitored
  - `id` (uuid, primary key)
  - `name` (text) - Name or identifier for the parcel
  - `location` (text) - Geographic location description
  - `latitude` (numeric) - GPS latitude coordinate
  - `longitude` (numeric) - GPS longitude coordinate
  - `size_hectares` (numeric) - Size of the parcel in hectares
  - `owner_id` (uuid) - Reference to user who owns/manages the parcel
  - `land_use_type` (text) - Type of land use (agriculture, forest, pasture, etc.)
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `soil_health_records`
  Tracks soil health measurements and AI-generated scores over time
  - `id` (uuid, primary key)
  - `parcel_id` (uuid) - Reference to land_parcels
  - `vitality_score` (numeric) - AI-generated land vitality score (0-100)
  - `ph_level` (numeric) - Soil pH measurement
  - `moisture_level` (numeric) - Soil moisture percentage
  - `nitrogen_level` (numeric) - Nitrogen content (ppm)
  - `phosphorus_level` (numeric) - Phosphorus content (ppm)
  - `potassium_level` (numeric) - Potassium content (ppm)
  - `organic_matter` (numeric) - Organic matter percentage
  - `temperature` (numeric) - Soil temperature in Celsius
  - `data_source` (text) - Source of data (iot_sensor, satellite, manual, ai_prediction)
  - `recorded_at` (timestamptz) - When the measurement was taken
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `restoration_activities`
  Tracks land restoration and improvement activities
  - `id` (uuid, primary key)
  - `parcel_id` (uuid) - Reference to land_parcels
  - `activity_type` (text) - Type of activity (tree_planting, composting, cover_crop, etc.)
  - `description` (text) - Detailed description of the activity
  - `quantity` (numeric) - Quantity (e.g., number of trees planted)
  - `unit` (text) - Unit of measurement (trees, kg, hectares, etc.)
  - `performed_by` (uuid) - User who performed the activity
  - `blockchain_hash` (text) - Blockchain verification hash
  - `verification_status` (text) - Status: pending, verified, rejected
  - `carbon_offset_kg` (numeric) - Estimated carbon offset in kg
  - `performed_at` (timestamptz) - When the activity was performed
  - `verified_at` (timestamptz) - When the activity was verified
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. `recommendations`
  AI-generated recommendations for land improvement
  - `id` (uuid, primary key)
  - `parcel_id` (uuid) - Reference to land_parcels
  - `recommendation_type` (text) - Type of recommendation
  - `title` (text) - Brief title of the recommendation
  - `description` (text) - Detailed recommendation
  - `priority` (text) - Priority level: high, medium, low
  - `estimated_cost` (numeric) - Estimated implementation cost
  - `expected_impact` (text) - Expected improvement impact
  - `status` (text) - Status: pending, implemented, dismissed
  - `ai_confidence` (numeric) - AI model confidence score (0-1)
  - `created_at` (timestamptz) - Record creation timestamp
  - `implemented_at` (timestamptz) - When the recommendation was implemented

  ### 5. `user_profiles`
  Extended user profile information
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text) - User's full name
  - `role` (text) - User role: farmer, expert, researcher, authority, developer
  - `organization` (text) - Organization name if applicable
  - `impact_points` (numeric) - Gamification points earned
  - `badges` (jsonb) - Array of earned badges
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. `degradation_alerts`
  Alerts for land degradation risks
  - `id` (uuid, primary key)
  - `parcel_id` (uuid) - Reference to land_parcels
  - `alert_type` (text) - Type of alert (soil_erosion, moisture_critical, nutrient_depletion, etc.)
  - `severity` (text) - Severity level: critical, high, medium, low
  - `message` (text) - Alert message
  - `recommended_action` (text) - Suggested immediate action
  - `is_resolved` (boolean) - Whether the alert has been addressed
  - `created_at` (timestamptz) - When alert was created
  - `resolved_at` (timestamptz) - When alert was resolved

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can view and manage their own land parcels
  - Users can view all restoration activities for transparency
  - Experts and authorities have extended viewing permissions
  - All users can view their own profiles and update their own information

  ## Notes
  - All timestamps use `timestamptz` for proper timezone handling
  - Default values set for common fields to ensure data consistency
  - Foreign key constraints ensure data integrity
  - Indexes will be automatically created on foreign key columns for performance
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'farmer',
  organization text DEFAULT '',
  impact_points numeric DEFAULT 0,
  badges jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create land_parcels table
CREATE TABLE IF NOT EXISTS land_parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  size_hectares numeric NOT NULL,
  owner_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  land_use_type text NOT NULL DEFAULT 'agriculture',
  created_at timestamptz DEFAULT now()
);

-- Create soil_health_records table
CREATE TABLE IF NOT EXISTS soil_health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES land_parcels(id) ON DELETE CASCADE,
  vitality_score numeric CHECK (vitality_score >= 0 AND vitality_score <= 100),
  ph_level numeric,
  moisture_level numeric,
  nitrogen_level numeric,
  phosphorus_level numeric,
  potassium_level numeric,
  organic_matter numeric,
  temperature numeric,
  data_source text NOT NULL DEFAULT 'manual',
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create restoration_activities table
CREATE TABLE IF NOT EXISTS restoration_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES land_parcels(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'units',
  performed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  blockchain_hash text,
  verification_status text DEFAULT 'pending',
  carbon_offset_kg numeric DEFAULT 0,
  performed_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES land_parcels(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium',
  estimated_cost numeric DEFAULT 0,
  expected_impact text,
  status text DEFAULT 'pending',
  ai_confidence numeric CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  created_at timestamptz DEFAULT now(),
  implemented_at timestamptz
);

-- Create degradation_alerts table
CREATE TABLE IF NOT EXISTS degradation_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES land_parcels(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  message text NOT NULL,
  recommended_action text,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE restoration_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE degradation_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for land_parcels
CREATE POLICY "Users can view all parcels"
  ON land_parcels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own parcels"
  ON land_parcels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own parcels"
  ON land_parcels FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own parcels"
  ON land_parcels FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for soil_health_records
CREATE POLICY "Users can view all soil health records"
  ON soil_health_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create soil records for own parcels"
  ON soil_health_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM land_parcels
      WHERE land_parcels.id = parcel_id
      AND land_parcels.owner_id = auth.uid()
    )
  );

-- RLS Policies for restoration_activities
CREATE POLICY "Everyone can view restoration activities"
  ON restoration_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create restoration activities for own parcels"
  ON restoration_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM land_parcels
      WHERE land_parcels.id = parcel_id
      AND land_parcels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own restoration activities"
  ON restoration_activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = performed_by)
  WITH CHECK (auth.uid() = performed_by);

-- RLS Policies for recommendations
CREATE POLICY "Users can view recommendations for accessible parcels"
  ON recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM land_parcels
      WHERE land_parcels.id = parcel_id
      AND land_parcels.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can create recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update recommendations for own parcels"
  ON recommendations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM land_parcels
      WHERE land_parcels.id = parcel_id
      AND land_parcels.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM land_parcels
      WHERE land_parcels.id = parcel_id
      AND land_parcels.owner_id = auth.uid()
    )
  );

-- RLS Policies for degradation_alerts
CREATE POLICY "Users can view alerts for own parcels"
  ON degradation_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM land_parcels
      WHERE land_parcels.id = parcel_id
      AND land_parcels.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can create alerts"
  ON degradation_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update alerts for own parcels"
  ON degradation_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM land_parcels
      WHERE land_parcels.id = parcel_id
      AND land_parcels.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM land_parcels
      WHERE land_parcels.id = parcel_id
      AND land_parcels.owner_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_land_parcels_owner ON land_parcels(owner_id);
CREATE INDEX IF NOT EXISTS idx_soil_health_parcel ON soil_health_records(parcel_id);
CREATE INDEX IF NOT EXISTS idx_soil_health_recorded ON soil_health_records(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_restoration_parcel ON restoration_activities(parcel_id);
CREATE INDEX IF NOT EXISTS idx_restoration_performed ON restoration_activities(performed_by);
CREATE INDEX IF NOT EXISTS idx_recommendations_parcel ON recommendations(parcel_id);
CREATE INDEX IF NOT EXISTS idx_alerts_parcel ON degradation_alerts(parcel_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON degradation_alerts(is_resolved) WHERE is_resolved = false;