// src/utils/roleMapping.ts
//
// The real backend and the frontend model roles/departments differently:
//   Backend UserRole:    'admin' | 'control_officer' | 'department_user'
//   Backend Department:  'Engineering' | 'Traction' | 'Signal_Telecom'
//   Frontend Role:       'engineering' | 'traction' | 'signal' | 'control' | 'admin'
//   Frontend Department: 'Engineering' | 'Traction' | 'Signal & Telecom' | 'Cross-Department'
//
// This is the single place that translates between the two so the rest of
// the app never has to think about the backend's enum values.

import { User, Role } from '../types';
import { BackendUser, BackendDepartment } from './apiClient';

function mapBackendDepartmentLabel(dept: BackendDepartment | null): string {
  switch (dept) {
    case 'Engineering':
      return 'Engineering';
    case 'Traction':
      return 'Traction';
    case 'Signal_Telecom':
      return 'Signal & Telecom';
    default:
      return 'Control Office';
  }
}

export function mapBackendUserToFrontend(backendUser: BackendUser): User {
  let role: Role;

  if (backendUser.role === 'admin') {
    role = 'admin';
  } else if (backendUser.role === 'control_officer') {
    role = 'control';
  } else {
    // department_user - role depends on which department they belong to
    switch (backendUser.department) {
      case 'Engineering':
        role = 'engineering';
        break;
      case 'Traction':
        role = 'traction';
        break;
      case 'Signal_Telecom':
        role = 'signal';
        break;
      default:
        role = 'engineering';
    }
  }

  return {
    id: backendUser.id,
    name: backendUser.name,
    department: mapBackendDepartmentLabel(backendUser.department),
    role,
    username: backendUser.email,
  };
}
