"use client";

import { useEffect, useRef, useState } from "react";

type Provider = "browser" | "azure" | "google" | "openai";
type RecognitionResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const LANGUAGES = [
  ["French", "FR", "fr-FR"], ["German", "DE", "de-DE"], ["English", "EN", "en-US"],
  ["Russian", "RU", "ru-RU"], ["Korean", "KO", "ko-KR"], ["Japanese", "JA", "ja-JP"],
  ["Chinese", "ZH", "zh-CN"], ["Swedish", "SV", "sv-SE"]
] as const;

export default function CommunicatorLiveListening() {
  const [source, setSource] = useState("French");
  const [target, setTarget] = useState("German");
  const [provider, setProvider] = useState<Provider>("browser");
  const [active, setActive] = useState(false);
  const [original, setOriginal] = useState("");
  const [translated, setTranslated] = useState("");
  const [error, setError] = useState("");
  const [voice, setVoice] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const generation = useRef(0);

  function stop() {
    generation.current += 1;
    recognition.current?.stop();
    recognition.current = null;
    setActive(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  useEffect(() => () => {
    generation.current += 1;
    recognition.current?.stop();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  async function translate(text: string, token: number) {
    try {
      const sourceCode = LANGUAGES.find((item) => item[0] === source)?.[1] ?? "FR";
      const targetInfo = LANGUAGES.find((item) => item[0] === target) ?? LANGUAGES[1];
      const response = await fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source: sourceCode, target: targetInfo[1] })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Translation failed");
      if (token !== generation.current) return;
      const result = String(payload.translated ?? "");
      setTranslated(result);
      if (voice && result && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(result);
        utterance.lang = targetInfo[2];
        window.speechSynthesis.speak(utterance);
      }
    } catch (cause) {
      if (token === generation.current) setError(cause instanceof Error ? cause.message : "Translation failed");
    }
  }

  function start() {
    stop();
    setError("");
    if (provider !== "browser") {
      setError("This premium engine is under evaluation and is not yet connected. Use Browser pilot for now.");
      return;
    }
    const speechWindow = window as SpeechWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Live browser speech recognition is unavailable. Try Chrome or Edge and allow microphone access.");
      return;
    }
    const session = generation.current;
    const recognizer = new SpeechRecognition();
    recognizer.lang = LANGUAGES.find((item) => item[0] === source)?.[2] ?? "fr-FR";
    recognizer.continuous = true;
    recognizer.interimResults = false;
    recognizer.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const phrase = last?.[0]?.transcript?.trim() ?? "";
      if (!phrase || session !== generation.current) return;
      setOriginal(phrase);
      void translate(phrase, session);
    };
    recognizer.onerror = () => {
      if (session === generation.current) setError("Speech recognition stopped. Check microphone permission and retry.");
    };
    recognizer.onend = () => {
      if (session === generation.current) setActive(false);
    };
    recognition.current = recognizer;
    try { recognizer.start(); setActive(true); }
    catch { setError("Unable to start speech recognition."); }
  }

  return (
    <section className="card spacious-card" aria-label="Communicator live listening">
      <div className="section-badge">LIVE LISTENING · PILOT</div>
      <div className="section-title large-title">Follow a conversation as it happens</div>
      <p className="section-note">Explicit microphone permission required. This browser pilot sends recognised text to the existing translation service. No audio is saved by this component; browser speech services may process audio externally.</p>
      <div className="grid-2 form-top-gap">
        <div><label htmlFor="live-source">Spoken language</label><select id="live-source" value={source} disabled={active} onChange={(event) => setSource(event.target.value)}>{LANGUAGES.map((lang) => <option key={lang[1]}>{lang[0]}</option>)}</select></div>
        <div><label htmlFor="live-target">Translate into</label><select id="live-target" value={target} disabled={active} onChange={(event) => setTarget(event.target.value)}>{LANGUAGES.map((lang) => <option key={lang[1]}>{lang[0]}</option>)}</select></div>
      </div>
      <div className="form-top-gap"><label htmlFor="live-provider">Speech engine</label><select id="live-provider" value={provider} disabled={active} onChange={(event) => setProvider(event.target.value as Provider)}>
        <option value="browser">Browser recognition · pilot</option><option value="azure">Microsoft Azure · pending integration</option><option value="google">Google Cloud · pending integration</option><option value="openai">OpenAI · pending integration</option>
      </select></div>
      <label style={{display:"flex",gap:8,alignItems:"center",marginTop:12}}><input type="checkbox" checked={voice} onChange={(event) => setVoice(event.target.checked)}/> Read translations aloud</label>
      <div className="actions actions-large form-top-gap">
        <button onClick={active ? stop : start}>{active ? "■ Stop listening" : "🎤 Start listening"}</button>
        <button className="secondary-btn" onClick={() => {stop();setOriginal("");setTranslated("");setError("");}}>Clear</button>
      </div>
      <p role="status">{active ? "Microphone listening is active" : "Microphone is off"}</p>
      {error && <p role="alert" style={{color:"#b45309"}}>{error}</p>}
      <div className="grid-2 form-top-gap">
        <div><strong>Original</strong><p aria-live="polite">{original || "Waiting for speech…"}</p></div>
        <div><strong>Translation</strong><p aria-live="polite">{translated || "Translation appears here…"}</p></div>
      </div>
    </section>
  );
}
