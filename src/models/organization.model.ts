export interface OrganizationRequest {
  name: string;
  description?: string;
  address?: string;
  location?: string; 
  court_count?: number;
  flooring_type?: string;
  amenities?: any[];
  logo_url?: string;
  banner_url?: string;
  gst_number?: string;
  business_email?: string;
  
  // 🔴 SYSTEM GENERATED (Frontend ko inhe bhejne ki koi zaroorat nahi)
  id?: string;          // Backend DB automatically UUID generate karega
  owner_id?: string;    // Backend token se khud nikalega (Security!)
  slug?: string;        // Backend name se khud banayega
  status?: string | boolean; // Default 'PENDING' ya 'ACTIVE' backend set karega
  created_at?: Date;    // DB ka default NOW() handle karega
  updated_at?: Date;    // DB handle karega
}