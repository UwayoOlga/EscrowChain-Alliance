import { Transaction, Property, Dispute } from './types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TX-1001', date: '2023-10-01', amount: 1200, currency: 'ADA', property: '123 Blockchain Blvd', status: 'completed', recipient: 'Landlord Alice' },
  { id: 'TX-1002', date: '2023-11-01', amount: 1200, currency: 'ADA', property: '123 Blockchain Blvd', status: 'completed', recipient: 'Landlord Alice' },
  { id: 'TX-1003', date: '2023-12-01', amount: 1200, currency: 'ADA', property: '123 Blockchain Blvd', status: 'locked', recipient: 'Escrow Contract' },
];

export const MOCK_PROPERTIES: Property[] = [
  { id: 'PROP-001', address: '123 Blockchain Blvd, Crypto City', rentAmount: 1200, landlord: 'Alice Smith', status: 'occupied', conditionStatus: 'fully_approved' },
  { id: 'PROP-002', address: '456 Satoshi Street, Decentraland', rentAmount: 850, landlord: 'Bob Jones', status: 'occupied', conditionStatus: 'pending_review' },
  { id: 'PROP-003', address: '789 Ada Avenue, Lovelace', rentAmount: 1500, landlord: 'Charlie Day', status: 'maintenance', conditionStatus: 'landlord_approved' },
];

export const MOCK_DISPUTES: Dispute[] = [
  { id: 'DSP-001', propertyId: 'PROP-002', raisedBy: 'Tenant', issue: 'Leaking roof not fixed', status: 'open', date: '2023-12-05' },
];

export const CHART_DATA_PAYMENTS = [
  { name: 'Aug', amount: 3200 },
  { name: 'Sep', amount: 3400 },
  { name: 'Oct', amount: 3200 },
  { name: 'Nov', amount: 3600 },
  { name: 'Dec', amount: 2400 }, // Lower because some are locked/pending
];

export const CHART_DATA_DISPUTES = [
  { name: 'Resolved', value: 12 },
  { name: 'Open', value: 3 },
  { name: 'Pending', value: 2 },
];
