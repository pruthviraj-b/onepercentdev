export type IdentityRole =
  | 'super_admin'
  | 'admin'
  | 'instructor'
  | 'teaching_assistant'
  | 'student'
  | 'enterprise_manager'
  | 'organization_admin'
  | 'organization_member'
  | 'guest';

export type AccessType = 'free' | 'purchased' | 'subscription' | 'enterprise' | 'trial' | 'preview' | 'lifetime' | 'expired' | 'bundle' | 'unknown';
