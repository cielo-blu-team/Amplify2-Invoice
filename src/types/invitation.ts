import type { Role } from './user';

export type InvitationStatus = 'pending' | 'used' | 'expired';

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  createdBy: string;      // userId of admin
  createdByName: string;
  createdAt: string;
  expiresAt: string;      // 7 days from creation
  status: InvitationStatus;
  usedAt?: string;
  usedByUid?: string;
}

export interface InvitationCreateInput {
  email: string;
  role: Role;
}
