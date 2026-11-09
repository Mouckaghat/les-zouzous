"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioCaptureSource = "microphone" | "tab";
export type AudioCaptureStatus = "idle" | "requesting" | "capturing" | "error";

function describeCaptureError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "Audio permission was denied. Allow microphone or tab sharing in your browser and try again.";
    if (error.name === "NotFoundError") return "No suitable audio source was found.";
    if (error.name === "NotReadableError") return "The selected audio source could not be opened. Close other recording applications and retry.";
  }
  return error instanceof Error ? error.message : "Unable to start audio capture.";
}

/**
 * Explicit user-initiated audio capture for Communicator.
 * This hook captures only; it does not upload, store, or transcribe audio.
 * Call start() directly from a click handler to satisfy browser permission rules.
 */
export function useCommunicatorAudioCapture() {
  const [status, setStatus] = useState<AudioCaptureStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingRef = useRef(0);

  const stop = useCallback(() => {
    pendingRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStatus("idle");
  }, []);

  const start = useCallback(async (source: AudioCaptureSource): Promise<MediaStream | null> => {
    stop();
    const requestId = pendingRef.current;
    setError(null);
    setStatus("requesting");
    try {
      if (!navigator.mediaDevices) throw new Error("Audio capture requires HTTPS or localhost and a supported browser.");
      let stream: MediaStream;
      if (source === "microphone") {
        if (!navigator.mediaDevices.getUserMedia) throw new Error("Microphone capture is unavailable in this browser.");
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      } else {
        if (!navigator.mediaDevices.getDisplayMedia) throw new Error("Tab audio sharing is unavailable in this browser. Try Chrome or Edge, or use the microphone.");
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      }
      if (requestId !== pendingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }
      if (stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("The selected tab did not provide audio. Share a browser tab and enable audio sharing, or use the microphone.");
      }
      streamRef.current = stream;
      stream.getTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (streamRef.current === stream) stop();
        }, { once: true });
      });
      setStatus("capturing");
      return stream;
    } catch (cause) {
      if (requestId === pendingRef.current) {
        setError(describeCaptureError(cause));
        setStatus("error");
      }
      return null;
    }
  }, [stop]);

  useEffect(() => () => {
    pendingRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  return { status, error, start, stop };
}
