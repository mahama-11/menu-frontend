export interface Organization {
  id: string;
  name: string;
  status: string;
  role: string;
  created_at: string;
  entitlements?: string[]; // E.g., ['kyc', 'attendance', 'menu_ai']
}

export interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  role: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  org_id?: string;
  org_name?: string;
  org_role?: string;
  restaurant_name?: string;
  language_preference?: string;
  plan_id?: string;
  orgs?: Organization[];
  organizations?: Organization[];
  last_active_org_id?: string;
  access?: AccessContext;
}

export interface AccessContext {
  active_org_id: string;
  has_menu_access: boolean;
  menu_roles: string[];
  menu_permissions: string[];
  platform_permissions?: string[];
}

export interface CreditsSummary {
  asset_code: string;
  balance: number;
  rewarded: number;
  reward_granted: boolean;
  max_credits: number | null;
  plan_name: string;
  plan_tier: string;
  reset_date: string | null;
  billing_model: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  credits: CreditsSummary;
  access: AccessContext;
}

export interface APIResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  error?: string;
  error_code?: string;
  error_hint?: string;
}
