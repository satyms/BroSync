import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';

export const contestsService = {
  getContests: (params = {}) =>
    axiosInstance.get(API_ROUTES.CONTESTS, { params }).then((r) => r.data?.data),

  getContest: (slug) =>
    axiosInstance.get(API_ROUTES.CONTEST_DETAIL(slug)).then((r) => r.data?.data),

  joinContest: (slug, body = {}) =>
    axiosInstance.post(API_ROUTES.CONTEST_JOIN(slug), body).then((r) => r.data?.data),

  getLeaderboard: (slug, params = {}) =>
    axiosInstance.get(API_ROUTES.CONTEST_LEADERBOARD(slug), { params }).then((r) => r.data?.data),
};
