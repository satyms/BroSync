"""
Proctor - Face Analysis Service
================================
Uses OpenCV's Haar cascade classifiers to detect whether the
contestant's face is present and centred on screen.

Violations are tracked in Redis (see views.py) — no DB write per frame.

Detection logic
---------------
1. Convert the incoming base64 webcam frame to a numpy array.
2. Run ``haarcascade_frontalface_default`` on the greyscale image.
3. If **no face** is found → violation (user looked away / not on screen).
4. If the detected face bounding box is too far from the frame centre
   → violation (user turning away).
5. If the face is too small relative to the frame → violation
   (user too far / partially out of frame).
"""

import base64
import io
import logging
import os

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger("apps.proctor")

# ── Load Haar cascades once at module level ────────────────────
_CASCADE_PATH = os.path.join(
    os.path.dirname(cv2.__file__), "data", "haarcascade_frontalface_default.xml"
)
_face_cascade = cv2.CascadeClassifier(_CASCADE_PATH)

# Fall-back: if the bundled path doesn't exist, try cv2.data.haarcascades
if _face_cascade.empty():
    _alt = getattr(cv2, "data", None)
    if _alt:
        _face_cascade = cv2.CascadeClassifier(
            os.path.join(_alt.haarcascades, "haarcascade_frontalface_default.xml")
        )


def decode_base64_frame(data_uri: str) -> np.ndarray:
    """Convert a base64 data-URI (or raw b64 string) to a numpy BGR image."""
    # Strip optional data URI prefix  (e.g. "data:image/jpeg;base64,...")
    if "," in data_uri:
        data_uri = data_uri.split(",", 1)[1]

    raw = base64.b64decode(data_uri)
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    arr = np.array(image)
    # PIL gives RGB; OpenCV expects BGR
    return arr[:, :, ::-1].copy()


def analyse_frame(frame: np.ndarray) -> dict:
    """
    Analyse a single webcam frame for face presence.

    Returns
    -------
    dict  with keys:
        looking_away : bool   – True when the user is NOT facing the screen
        confidence   : float  – rough confidence proxy (0-1)
        reason       : str    – human-readable explanation
    """
    grey = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    grey = cv2.equalizeHist(grey)  # normalise lighting

    faces = _face_cascade.detectMultiScale(
        grey,
        scaleFactor=1.15,
        minNeighbors=5,
        minSize=(60, 60),
        flags=cv2.CASCADE_SCALE_IMAGE,
    )

    if len(faces) == 0:
        return {
            "looking_away": True,
            "confidence": 0.0,
            "reason": "no_face_detected",
        }

    # Pick the largest detected face (most prominent)
    faces_sorted = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    x, y, w, h = faces_sorted[0]

    frame_h, frame_w = frame.shape[:2]

    # ── Size check: face should be at least ~5 % of the frame area ──
    face_area_ratio = (w * h) / (frame_w * frame_h) if (frame_w and frame_h) else 0
    if face_area_ratio < 0.03:
        return {
            "looking_away": True,
            "confidence": round(face_area_ratio * 10, 3),
            "reason": "face_too_small",
        }

    # ── Position check: face centre shouldn't be at the extreme edges ──
    face_cx = (x + w / 2) / frame_w
    face_cy = (y + h / 2) / frame_h

    if face_cx < 0.10 or face_cx > 0.90 or face_cy < 0.10 or face_cy > 0.90:
        return {
            "looking_away": True,
            "confidence": round(min(face_area_ratio * 10, 1.0), 3),
            "reason": "face_at_edge",
        }

    # Compute a simple confidence proxy from area ratio + centring
    centre_dist = ((face_cx - 0.5) ** 2 + (face_cy - 0.5) ** 2) ** 0.5
    confidence = min(1.0, face_area_ratio * 8) * max(0.0, 1.0 - centre_dist * 2)

    return {
        "looking_away": False,
        "confidence": round(confidence, 3),
        "reason": "face_detected",
    }
