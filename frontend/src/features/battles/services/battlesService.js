import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';

export const battlesService = {
  /** Send a challenge to another user */
  sendRequest: (opponentUsername, difficulty) => {
    console.log('[battlesService.sendRequest] payload:', { opponent_username: opponentUsername, difficulty });
    return axiosInstance
      .post(API_ROUTES.BATTLES_SEND_REQUEST, { opponent_username: opponentUsername, difficulty })
      .then((r) => r.data?.data);
  },

  /** Get incoming pending battle requests */
  getInbox: () =>
    axiosInstance.get(API_ROUTES.BATTLES_INBOX).then((r) => r.data?.data?.results || []),

  /** Accept or reject a battle request */
  respond: (requestId, accepted) =>
    axiosInstance
      .post(API_ROUTES.BATTLES_RESPOND(requestId), { accepted })
      .then((r) => r.data?.data),

  /** Get full detail of a battle */
  getBattle: (battleId) =>
    axiosInstance.get(API_ROUTES.BATTLES_DETAIL(battleId)).then((r) => r.data?.data),

  /** Get all battles for current user */
  getMyBattles: () =>
    axiosInstance.get(API_ROUTES.BATTLES_MY).then((r) => r.data?.data?.results || []),

  /** Get completed battle history with results */
  getBattleHistory: () =>
    axiosInstance.get(API_ROUTES.BATTLES_HISTORY).then((r) => r.data?.data?.results || []),

  /** Submit code (REST fallback, prefer WS) */
  submit: (battleId, problemId, code, language) =>
    axiosInstance
      .post(API_ROUTES.BATTLES_SUBMIT(battleId), { problem_id: problemId, code, language })
      .then((r) => r.data?.data),
};
