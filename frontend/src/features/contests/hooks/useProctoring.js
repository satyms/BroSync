/**
 * useProctoring - Webcam face-tracking hook for contest proctoring.
 *
 * When enabled (contest mode):
 *  1. Requests webcam access.
 *  2. Captures a frame every CAPTURE_INTERVAL ms.
 *  3. Sends the frame to the backend DeepFace endpoint.
 *  4. Tracks violations — if > MAX_VIOLATIONS the contest is ended
 *     and the user's code is auto-submitted.
 *
 * Returns an object the consuming component can use to render
 * a webcam preview, violation counter, and warnings.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { proctorService } from '../services/proctorService';

const CAPTURE_INTERVAL = 3500; // ms between captures
const MAX_VIOLATIONS = 5;

export default function useProctoring({ enabled, contestId, onDisqualified }) {
  const [stream, setStream] = useState(null);
  const [violations, setViolations] = useState(0);
  const [disqualified, setDisqualified] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const intervalRef = useRef(null);
  const analysingRef = useRef(false);
  const disqualifiedRef = useRef(false);

  // ── Start webcam ────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(mediaStream);
        setCameraReady(true);
      } catch (err) {
        setCameraError(err.name === 'NotAllowedError'
          ? 'Camera access denied. Please enable camera permissions for proctoring.'
          : 'Could not access camera. Make sure no other app is using it.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // ── Attach stream to video element ──────────────────────
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  // ── Fetch existing violation count on mount ─────────────
  useEffect(() => {
    if (!enabled || !contestId) return;

    proctorService.getStatus(contestId)
      .then((data) => {
        setViolations(data.violations || 0);
        if (data.disqualified) {
          setDisqualified(true);
          disqualifiedRef.current = true;
        }
      })
      .catch(() => {}); // first load — best effort
  }, [enabled, contestId]);

  // ── Capture & send frames periodically ──────────────────
  const captureAndAnalyse = useCallback(async () => {
    if (analysingRef.current || disqualifiedRef.current) return;
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    analysingRef.current = true;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUri = canvas.toDataURL('image/jpeg', 0.6);

      const result = await proctorService.analyzeFrame({
        frame: dataUri,
        contest_id: contestId,
      });

      setLastResult(result);
      setViolations(result.violations);

      if (result.looking_away) {
        toast.error(
          `⚠️ Face violation ${result.violations}/${MAX_VIOLATIONS} — Look at the screen!`,
          { id: 'proctor-warn', duration: 3000 },
        );
      }

      if (result.disqualified) {
        disqualifiedRef.current = true;
        setDisqualified(true);
        toast.error(
          '🚫 Too many violations! Your contest has been ended and code auto-submitted.',
          { id: 'proctor-dq', duration: 8000 },
        );
        onDisqualified?.();
      }
    } catch (err) {
      // Network / parsing errors — silently skip this frame
      console.warn('[proctor] frame analysis failed:', err.message);
    } finally {
      analysingRef.current = false;
    }
  }, [contestId, onDisqualified]);

  useEffect(() => {
    if (!enabled || !cameraReady || disqualified) return;

    intervalRef.current = setInterval(captureAndAnalyse, CAPTURE_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, cameraReady, disqualified, captureAndAnalyse]);

  // ── Cleanup stream on unmount ───────────────────────────
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  return {
    videoRef,
    violations,
    maxViolations: MAX_VIOLATIONS,
    disqualified,
    cameraError,
    cameraReady,
    lastResult,
  };
}
