export type UserRole = 'tenant' | 'landlord' | 'admin';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  property: string;
  status: 'pending' | 'completed' | 'locked' | 'disputed';
  recipient: string;
}

export interface Property {
  id: string;
  address: string;
  rentAmount: number;
  landlord: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  conditionStatus?: 'pending_review' | 'tenant_approved' | 'landlord_approved' | 'fully_approved';
}

export interface Dispute {
  id: string;
  propertyId: string;
  raisedBy: string;
  issue: string;
  status: 'open' | 'resolving' | 'closed';
  date: string;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
  provider: 'Nami' | 'Eternl' | 'Lace' | null;
}
