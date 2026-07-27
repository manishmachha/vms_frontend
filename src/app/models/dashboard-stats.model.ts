export interface StatItem {
    label: string;
    count: number;
    icon: string;
    route: string;
    items?: StatDetail[];
    subStats?: Record<string, import('../services/dashboard.service').ChartData[]>;
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
