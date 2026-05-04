export interface Transaction {
  id: string;
  uid: string;
  passengerName: string;
  amount: number;
  status: "PAID" | "FAILED";
  lat: number;
  lng: number;
  mapLink: string;
  timestamp: string;
  route: string;
}

export interface LogEntry {
  id: string;
  uid: string;
  event: string;
  timestamp: string;
  status: "success" | "error" | "info";
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-001",
    uid: "A3F209B1",
    passengerName: "Maria Santos",
    amount: 12,
    status: "PAID",
    lat: 12.0739,
    lng: 124.6050,
    mapLink: "https://www.google.com/maps?q=12.073900,124.605000",
    timestamp: "2025-05-04T08:22:11",
    route: "Calbayog City Proper",
  },
  {
    id: "TXN-002",
    uid: "B1C34D22",
    passengerName: "Jose Dela Cruz",
    amount: 15,
    status: "PAID",
    lat: 12.0712,
    lng: 124.6082,
    mapLink: "https://www.google.com/maps?q=12.071200,124.608200",
    timestamp: "2025-05-04T08:45:33",
    route: "Nijaga Park",
  },
  {
    id: "TXN-003",
    uid: "C9A12F55",
    passengerName: "Ana Reyes",
    amount: 12,
    status: "FAILED",
    lat: 12.0755,
    lng: 124.6041,
    mapLink: "https://www.google.com/maps?q=12.075500,124.604100",
    timestamp: "2025-05-04T09:10:05",
    route: "Calbayog City Proper",
  },
  {
    id: "TXN-004",
    uid: "A3F209B1",
    passengerName: "Maria Santos",
    amount: 12,
    status: "PAID",
    lat: 12.0788,
    lng: 124.6025,
    mapLink: "https://www.google.com/maps?q=12.078800,124.602500",
    timestamp: "2025-05-04T11:30:22",
    route: "Calbayog City Proper",
  },
  {
    id: "TXN-005",
    uid: "D7E98C11",
    passengerName: "Pedro Bautista",
    amount: 15,
    status: "PAID",
    lat: 12.0699,
    lng: 124.6099,
    mapLink: "https://www.google.com/maps?q=12.069900,124.609900",
    timestamp: "2025-05-04T12:05:47",
    route: "Nijaga Park",
  },
  {
    id: "TXN-006",
    uid: "E2F01A88",
    passengerName: "Luz Mercado",
    amount: 12,
    status: "FAILED",
    lat: 12.0743,
    lng: 124.6058,
    mapLink: "https://www.google.com/maps?q=12.074300,124.605800",
    timestamp: "2025-05-04T13:22:19",
    route: "Calbayog City Proper",
  },
  {
    id: "TXN-007",
    uid: "A3F209B1",
    passengerName: "Maria Santos",
    amount: 12,
    status: "PAID",
    lat: 12.0731,
    lng: 124.6063,
    mapLink: "https://www.google.com/maps?q=12.073100,124.606300",
    timestamp: "2025-05-04T15:45:00",
    route: "Calbayog City Proper",
  },
  {
    id: "TXN-008",
    uid: "F3B22C99",
    passengerName: "Carlos Gomez",
    amount: 15,
    status: "PAID",
    lat: 12.0718,
    lng: 124.6077,
    mapLink: "https://www.google.com/maps?q=12.071800,124.607700",
    timestamp: "2025-05-04T16:10:33",
    route: "Nijaga Park",
  },
];

export const MOCK_LOGS: LogEntry[] = [
  { id: "L1", uid: "A3F209B1", event: "Card scanned — PAID ₱12.00", timestamp: "2025-05-04T08:22:11", status: "success" },
  { id: "L2", uid: "B1C34D22", event: "Card scanned — PAID ₱15.00", timestamp: "2025-05-04T08:45:33", status: "success" },
  { id: "L3", uid: "C9A12F55", event: "Card scanned — FAILED: low balance", timestamp: "2025-05-04T09:10:05", status: "error" },
  { id: "L4", uid: "SYSTEM",   event: "ESP32 reconnected to broker", timestamp: "2025-05-04T09:30:00", status: "info" },
  { id: "L5", uid: "A3F209B1", event: "Card scanned — PAID ₱12.00", timestamp: "2025-05-04T11:30:22", status: "success" },
  { id: "L6", uid: "D7E98C11", event: "Card scanned — PAID ₱15.00", timestamp: "2025-05-04T12:05:47", status: "success" },
  { id: "L7", uid: "E2F01A88", event: "Card scanned — FAILED: card not registered", timestamp: "2025-05-04T13:22:19", status: "error" },
  { id: "L8", uid: "SYSTEM",   event: "GPS fix acquired — Calbayog City", timestamp: "2025-05-04T13:45:00", status: "info" },
  { id: "L9", uid: "A3F209B1", event: "Card scanned — PAID ₱12.00", timestamp: "2025-05-04T15:45:00", status: "success" },
  { id: "L10",uid: "F3B22C99", event: "Card scanned — PAID ₱15.00", timestamp: "2025-05-04T16:10:33", status: "success" },
];

export const MOCK_RESIDENTS = [
  { id: "1", name: "Maria Santos",   email: "maria@timbol.ph",  uid: "A3F209B1", balance: 245.50, status: "active",   rides: 28 },
  { id: "2", name: "Jose Dela Cruz", email: "jose@gmail.com",   uid: "B1C34D22", balance: 88.00,  status: "active",   rides: 12 },
  { id: "3", name: "Ana Reyes",      email: "ana@gmail.com",    uid: "C9A12F55", balance: 5.00,   status: "low",      rides: 7  },
  { id: "4", name: "Pedro Bautista", email: "pedro@gmail.com",  uid: "D7E98C11", balance: 150.00, status: "active",   rides: 19 },
  { id: "5", name: "Luz Mercado",    email: "luz@gmail.com",    uid: "E2F01A88", balance: 0,      status: "inactive", rides: 3  },
  { id: "6", name: "Carlos Gomez",   email: "carlos@gmail.com", uid: "F3B22C99", balance: 320.00, status: "active",   rides: 34 },
];

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
export function formatDateTime(iso: string) {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}
