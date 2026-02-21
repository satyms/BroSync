import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';

export const problemsService = {
  /**
   * Get paginated problem list with optional filters.
   */
  getProblems: (params = {}) =>
    axiosInstance.get(API_ROUTES.PROBLEMS, { params }).then((r) => r.data),

  /**
   * Get a single problem by slug.
   */
  getProblem: (slug) =>
    axiosInstance.get(API_ROUTES.PROBLEM_DETAIL(slug)).then((r) => r.data),

  /**
   * Get all categories.
   */
  getCategories: () =>
    axiosInstance.get(API_ROUTES.CATEGORIES).then((r) => r.data),
};
