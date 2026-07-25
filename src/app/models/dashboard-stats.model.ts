export interface StatItem {
    label: string;
    count: number;
    icon: string;
    route: string;
    items?: StatDetail[];
}

export interface StatDetail {
    id: number;
    name: string;
    subtitle?: string;
    date?: string;
    status?: string;
    badgeColor?: string;
}

export interface DashboardStatsResponse {
    stats: StatItem[];
}
