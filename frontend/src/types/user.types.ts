// user.types.ts - Llojet e të dhënave për përdoruesit

export type UserRole = 
  | 'super_admin'      // Kontroll total mbi sistemin
  | 'company_admin'    // Administron kompaninë
  | 'dispatcher'       // Menaxhon dërgesat
  | 'driver'           // Kryen dërgesat
  | 'customer';        // Klient i zakonshëm

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  organization?: {
    id: string;
    name: string;
    planType: string;
  };
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  organizationId?: string;
}

export interface RegisterResponse {
  user: UserProfile;
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
