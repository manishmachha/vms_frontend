export interface ChartData {
  label: string;
  value: number;
}

export interface StatItem {
    label: string;
    count: number;
    icon: string;
    route: string;
    items?: StatDetail[];
    subStats?: Record<string, ChartData[]>;
}

export interface StatDetail {
    id: string;
    name: string;
    subtitle?: string;
    date?: string;
    status?: string;
    badgeColor?: string;
}

export interface DashboardStatsResponse {
    stats: StatItem[];
}
