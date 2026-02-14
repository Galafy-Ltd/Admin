import apiClient from './client';

export interface DashboardMetrics {
  totalUsers: number;
  totalUsersGrowth: number;
  verifiedUsers: number;
  totalEvents: number;
  totalEventsGrowth: number;
  activeEvents: number;
  pendingKyc: number;
  revenue: string;
  revenueGrowth: number;
  totalSprayers: number;
  totalAttendees: number;
}

export const dashboardApi = {
  async getMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.getClient().get<DashboardMetrics>('/admin/dashboard/metrics');
    return response.data;
  },
};

