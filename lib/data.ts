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

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
export function formatDateTime(iso: string) {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}