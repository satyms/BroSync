import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';

export const submissionsService = {
  submit: (data) =>
    axiosInstance.post(API_ROUTES.SUBMISSIONS, data).then((r) => r.data),

  getSubmission: (id) =>
    axiosInstance.get(API_ROUTES.SUBMISSION_DETAIL(id)).then((r) => r.data),

  getMySubmissions: (params = {}) =>
    axiosInstance.get(API_ROUTES.MY_SUBMISSIONS, { params }).then((r) => r.data),

  getAllSubmissions: (params = {}) =>
    axiosInstance.get(API_ROUTES.SUBMISSIONS, { params }).then((r) => r.data),
};
