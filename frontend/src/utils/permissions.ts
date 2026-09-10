import { Role } from '../types';

export interface RolePermissions {
  canOptimize: boolean;     // AI vs Optimization pipeline
  canApprove: boolean;      // Approvals view (approve/reject)
  canCreateRequest: boolean;
  canDeleteRequest: boolean;
  canAccessSettings: boolean;
  canViewReports: boolean;
}

export const PERMISSIONS: Record<Role, RolePermissions> = {
  control:     { canOptimize: true,  canApprove: true,  canCreateRequest: true, canDeleteRequest: true, canAccessSettings: true,  canViewReports: true },
  admin:       { canOptimize: true,  canApprove: true,  canCreateRequest: true, canDeleteRequest: true, canAccessSettings: true,  canViewReports: true },
  engineering: { canOptimize: false, canApprove: false, canCreateRequest: true, canDeleteRequest: true, canAccessSettings: false, canViewReports: true },
  traction:    { canOptimize: false, canApprove: false, canCreateRequest: true, canDeleteRequest: true, canAccessSettings: false, canViewReports: true },
  signal:      { canOptimize: false, canApprove: false, canCreateRequest: true, canDeleteRequest: true, canAccessSettings: false, canViewReports: true },
};

export const can = (role: Role, permission: keyof typeof PERMISSIONS['control']): boolean => {
  if (!role || !PERMISSIONS[role]) return false;
  return PERMISSIONS[role][permission];
};
