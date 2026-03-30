export interface StatItem {
    label: string;
    count: number;
    icon: string;
    route: string;
}

export interface DashboardStatsResponse {
    stats: StatItem[];
}
