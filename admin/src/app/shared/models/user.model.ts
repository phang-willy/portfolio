import { UserRole } from '@/app/shared/models/user-role';

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: UserRole;
}
