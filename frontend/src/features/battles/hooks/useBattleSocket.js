/**
 * useBattleSocket
 * ================
 * Manages the WebSocket connection to a battle room.
 * Returns state shaped to match BattleRoomPage expectations.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_ROUTES } from '@shared/utils/constants';

export function useBattleSocket(battleId) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const [connected, setConnected]     = useState(false);
  const [battleState, setBattleState] = useState(null);   // full initial state object
  const [scores, setScores]           = useState([]);
  const [timeLeft, setTimeLeft]       = useState(30 * 60); // seconds
  const [submissionResult, setSubmissionResult] = useState(null);
  const [battleEnded, setBattleEnded] = useState(null);   // null or { winner, scores }
  const battleEndedRef = useRef(false); // ref copy so ws.onclose sees current value

  const connect = useCallback(() => {
    if (!battleId) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const url = `${WS_ROUTES.BATTLE(battleId)}?token=${token}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onclose = () => {
      setConnected(false);
      if (!battleEndedRef.current) {
        reconnectRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      switch (msg.type) {
        case 'battle_state': {
          setBattleState(msg);
          setScores(msg.participants || []);
          setTimeLeft(msg.seconds_remaining ?? 30 * 60);
          break;
        }
        case 'scoreboard_update':
          setScores(msg.scores || []);
          if (msg.seconds_remaining != null) setTimeLeft(msg.seconds_remaining);
          break;
        case 'timer_tick':
          setTimeLeft(msg.seconds_remaining ?? 0);
          break;
        case 'submission_result':
          setSubmissionResult(msg);
          break;
        case 'battle_ended':
          battleEndedRef.current = true;
          setBattleEnded({
            winner:   msg.winner,
            is_draw:  msg.is_draw,
            scores:   msg.scores || [],
            ended_at: msg.ended_at,
          });
          setBattleState((prev) => prev ? { ...prev, status: 'completed' } : prev);
          break;
        default:
          break;
      }
    };
  }, [battleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const submitCode = useCallback((problemId, code, language) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'submit',
        problem_id: problemId,
        code,
        language,
      }));
    }
  }, []);

  const requestEnd = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'request_end' }));
    }
  }, []);

  return {
    connected,
    battleState,
    scores,
    timeLeft,
    submissionResult,
    battleEnded,
    submitCode,
    requestEnd,
  };
}
