import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';

export const proctorService = {
  /**
   * Send a base64-encoded webcam frame for analysis.
   * @param {{ frame: string, contest_id: string, problem_id: string }} body
   */
  analyzeFrame: (body) =>
    axiosInstance
      .post(API_ROUTES.PROCTOR_ANALYZE, body, { timeout: 10000 })
      .then((r) => r.data?.data),

  /**
   * Get current violation count (no frame needed).
   * @param {string} contestId
   * @param {string} problemId
   */
  getStatus: (contestId, problemId) =>
    axiosInstance
      .get(API_ROUTES.PROCTOR_STATUS, { params: { contest_id: contestId, problem_id: problemId } })
      .then((r) => r.data?.data),
};
