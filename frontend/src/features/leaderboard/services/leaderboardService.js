import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';

export const leaderboardService = {
  getGlobalLeaderboard: (params = {}) =>
    axiosInstance.get(API_ROUTES.GLOBAL_LEADERBOARD, { params }).then((r) => r.data?.data),
};
