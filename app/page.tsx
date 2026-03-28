"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";

type UiLang = "en" | "fr" | "de";
type Mode = "translator" | "communicator" | "lili_visual";
type LanguageCode =
  | "auto"
  | "JA"
  | "ZH"
  | "RU"
  | "KO"
  | "SV"
  | "EN"
  | "FR"
  | "DE"
  | "IT";

type CommInputMode = "type" | "speak" | "photo";

type HistoryItem = {
  speaker: string;
  original: string;
  translated: string;
  targetLanguageName: string;
};

type LanguageOption = {
  label: string;
  code: LanguageCode;
};

const SOURCE_LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: "Auto-detect", code: "auto" },
  { label: "Japanese", code: "JA" },
  { label: "Chinese", code: "ZH" },
  { label: "Russian", code: "RU" },
  { label: "Korean", code: "KO" },
  { label: "Swedish", code: "SV" },
  { label: "English", code: "EN" },
  { label: "French", code: "FR" },
  { label: "German", code: "DE" },
  { label: "Italian", code: "IT" }
];

const TARGET_LANGUAGE_OPTIONS: LanguageOption[] = SOURCE_LANGUAGE_OPTIONS.filter(
  (item) => item.code !== "auto"
);

const LANGUAGE_CODE_BY_LABEL: Record<string, LanguageCode> = Object.fromEntries(
  SOURCE_LANGUAGE_OPTIONS.map((item) => [item.label, item.code])
) as Record<string, LanguageCode>;

const UI = {
  en: {
    chooseLanguage: "Choose your language",

    appTitle: "Les Zouzous — Universal Family Translator",
    appBlueLine:
      "Type, speak, photograph, or open communicator mode for two-way translation.",
    appSubtitle:
      "Your travel companion by Lobster Inc., under the Jura Technology umbrella.",

    juraTitle: "Jura Technology",
    translator: "✍️ Translator",
    communicator: "💬 Communicator",
    liliVisual: "👁️ Lili Visual",

    translatorBadge: "TRANSLATOR",
    translatorTitle: "Translate text or speech",
    translatorNote:
      "Write, speak, translate, and listen clearly in your selected language.",
    from: "From",
    to: "To",
    writeYourText: "Write your text",
    typeHere: "Type something here...",
    translate: "Translate",
    clear: "Clear",
    startListening: "Start listening",
    stopListening: "Stop listening",
    listening: "Listening...",
    speakOut: "Speak out",
    translationIn: "Translation in",

    communicatorBadge: "COMMUNICATOR MODE",
    communicatorTitle: "Communicate clearly in both directions",
    communicatorNote:
      "Each person can type, speak, or photograph text. Keep it quick and direct.",
    personASpeaks: "Person A speaks",
    personBSpeaks: "Person B speaks",
    swapLanguages: "Swap Languages",
    clearConversation: "Clear Conversation",
    message: "Message",
    routing: "Routing...",
    transmitAToB: "Transmit A → B",
    transmitBToA: "Transmit B → A",
    speakA: "Speak A",
    speakB: "Speak B",
    stopA: "Stop A",
    stopB: "Stop B",
    speakToA: "Speak to A",
    speakToB: "Speak to B",
    messageReceivedByA: "Message for Person A",
    messageReceivedByB: "Message for Person B",
    transmissionLog: "Transmission Log",
    original: "Original",
    translatedTo: "Translated to",
    personA: "Person A",
    personB: "Person B",
    typeTab: "⌨ Type",
    speakTab: "🎤 Speak",
    photoTab: "📷 Photo",

    liliBadge: "LILI VISUAL",
    liliTitle: "Read text from camera or uploaded image",
    liliNote:
      "Use your camera live, capture a frame, or upload an image and extract text before translating it.",
    liliSubNote:
      "Works best with clear printed text. Line breaks and spacing are preserved as much as possible.",
    liliLanguage: "Lili language",
    openCamera: "Open camera",
    closeCamera: "Close camera",
    capturePhoto: "Capture photo",
    uploadImage: "Upload image",
    imagePreview: "Image preview",
    extractedText: "Extracted text",
    translatedDocument: "Translated document",
    runLili: "Run Lili Visual",
    liliRunning: "Reading text...",
    copyToTranslator: "Copy to Translator",
    translateExtractedText: "Translate extracted text",
    noImageYet: "No image loaded yet.",
    savePdf: "Save as PDF",

    tips: "Tips",
    tipsText:
      "Camera access usually works on localhost and HTTPS. The first Lili Visual scan may feel slightly slower while OCR resources load.",

    errorNoText: "Please provide some text first.",
    errorPersonA: "Person A has no text yet.",
    errorPersonB: "Person B has no text yet.",
    errorNoImage: "Please capture or upload an image first.",
    errorCamera:
      "Unable to open camera. On mobile, this usually needs HTTPS or localhost plus camera permission.",
    errorSpeech: "Speech recognition is not supported on this browser.",
    errorOcr: "Lili Visual could not read this image clearly. Try a sharper image.",
    errorTranslateService:
      "Translation service currently unavailable. Please try again in a moment.",
    cameraNotReady:
      "Camera is not ready yet. Please wait one second and try again.",

    footer: "© Lobster Inc. / Jura Technology. All rights reserved."
  },

  fr: {
    chooseLanguage: "Choisissez votre langue",

    appTitle: "Les Zouzous — Traducteur Familial Universel",
    appBlueLine:
      "Écrivez, parlez, photographiez ou ouvrez le mode communication pour une traduction dans les deux sens.",
    appSubtitle:
      "Votre compagnon de voyage par Lobster Inc., sous l’ombrelle Jura Technology.",

    juraTitle: "Jura Technology",
    translator: "✍️ Traducteur",
    communicator: "💬 Communicateur",
    liliVisual: "👁️ Lili Visual",

    translatorBadge: "TRADUCTEUR",
    translatorTitle: "Traduire du texte ou de la voix",
    translatorNote:
      "Écrivez, parlez, traduisez et écoutez clairement dans votre langue choisie.",
    from: "De",
    to: "Vers",
    writeYourText: "Écrivez votre texte",
    typeHere: "Tapez quelque chose ici...",
    translate: "Traduire",
    clear: "Effacer",
    startListening: "Commencer l’écoute",
    stopListening: "Arrêter l’écoute",
    listening: "Écoute en cours...",
    speakOut: "Lire à voix haute",
    translationIn: "Traduction en",

    communicatorBadge: "MODE COMMUNICATION",
    communicatorTitle: "Communiquer clairement dans les deux sens",
    communicatorNote:
      "Chaque personne peut écrire, parler ou photographier du texte. L’expérience reste rapide et directe.",
    personASpeaks: "La personne A parle",
    personBSpeaks: "La personne B parle",
    swapLanguages: "Permuter les langues",
    clearConversation: "Effacer la conversation",
    message: "Message",
    routing: "Transmission...",
    transmitAToB: "Transmettre A → B",
    transmitBToA: "Transmettre B → A",
    speakA: "Parler A",
    speakB: "Parler B",
    stopA: "Arrêter A",
    stopB: "Arrêter B",
    speakToA: "Lire pour A",
    speakToB: "Lire pour B",
    messageReceivedByA: "Message pour la personne A",
    messageReceivedByB: "Message pour la personne B",
    transmissionLog: "Journal de transmission",
    original: "Original",
    translatedTo: "Traduit en",
    personA: "Personne A",
    personB: "Personne B",
    typeTab: "⌨ Texte",
    speakTab: "🎤 Parler",
    photoTab: "📷 Photo",

    liliBadge: "LILI VISUAL",
    liliTitle: "Lire le texte depuis la caméra ou une image téléchargée",
    liliNote:
      "Utilisez votre caméra en direct, capturez une image ou téléversez une photo, puis extrayez le texte avant de le traduire.",
    liliSubNote:
      "Fonctionne mieux avec un texte imprimé clair. Les sauts de ligne et l’espacement sont conservés autant que possible.",
    liliLanguage: "Langue de Lili",
    openCamera: "Ouvrir la caméra",
    closeCamera: "Fermer la caméra",
    capturePhoto: "Capturer la photo",
    uploadImage: "Téléverser une image",
    imagePreview: "Aperçu de l’image",
    extractedText: "Texte extrait",
    translatedDocument: "Document traduit",
    runLili: "Lancer Lili Visual",
    liliRunning: "Lecture du texte...",
    copyToTranslator: "Copier vers le traducteur",
    translateExtractedText: "Traduire le texte extrait",
    noImageYet: "Aucune image chargée pour le moment.",
    savePdf: "Enregistrer en PDF",

    tips: "Conseils",
    tipsText:
      "L’accès caméra fonctionne généralement sur localhost et HTTPS. Le premier scan Lili Visual peut sembler un peu plus lent pendant le chargement des ressources OCR.",

    errorNoText: "Veuillez d’abord saisir un texte.",
    errorPersonA: "La personne A n’a pas encore de texte.",
    errorPersonB: "La personne B n’a pas encore de texte.",
    errorNoImage: "Veuillez d’abord capturer ou téléverser une image.",
    errorCamera:
      "Impossible d’ouvrir la caméra. Sur mobile, cela nécessite généralement HTTPS ou localhost avec autorisation caméra.",
    errorSpeech:
      "La reconnaissance vocale n’est pas prise en charge sur ce navigateur.",
    errorOcr:
      "Lili Visual n’a pas pu lire cette image correctement. Essayez une image plus nette.",
    errorTranslateService:
      "Le service de traduction est actuellement indisponible. Veuillez réessayer dans un instant.",
    cameraNotReady:
      "La caméra n’est pas encore prête. Veuillez attendre une seconde et réessayer.",

    footer: "© Lobster Inc. / Jura Technology. Tous droits réservés."
  },

  de: {
    chooseLanguage: "Sprache wählen",

    appTitle: "Les Zouzous — Universeller Familienübersetzer",
    appBlueLine:
      "Schreiben, sprechen, fotografieren oder den Kommunikationsmodus für wechselseitige Übersetzung öffnen.",
    appSubtitle:
      "Ihr Reisebegleiter von Lobster Inc. unter dem Dach von Jura Technology.",

    juraTitle: "Jura Technology",
    translator: "✍️ Übersetzer",
    communicator: "💬 Kommunikator",
    liliVisual: "👁️ Lili Visual",

    translatorBadge: "ÜBERSETZER",
    translatorTitle: "Text oder Sprache übersetzen",
    translatorNote:
      "Schreiben, sprechen, übersetzen und klar anhören – in Ihrer gewählten Sprache.",
    from: "Von",
    to: "Nach",
    writeYourText: "Text eingeben",
    typeHere: "Hier etwas eingeben...",
    translate: "Übersetzen",
    clear: "Leeren",
    startListening: "Aufnahme starten",
    stopListening: "Aufnahme stoppen",
    listening: "Hört zu...",
    speakOut: "Vorlesen",
    translationIn: "Übersetzung auf",

    communicatorBadge: "KOMMUNIKATIONSMODUS",
    communicatorTitle: "Klar in beide Richtungen kommunizieren",
    communicatorNote:
      "Beide Personen können tippen, sprechen oder Text fotografieren. Die Erfahrung bleibt schnell und direkt.",
    personASpeaks: "Person A spricht",
    personBSpeaks: "Person B spricht",
    swapLanguages: "Sprachen tauschen",
    clearConversation: "Gespräch leeren",
    message: "Nachricht",
    routing: "Übertragung...",
    transmitAToB: "A → B senden",
    transmitBToA: "B → A senden",
    speakA: "A sprechen",
    speakB: "B sprechen",
    stopA: "A stoppen",
    stopB: "B stoppen",
    speakToA: "Für A vorlesen",
    speakToB: "Für B vorlesen",
    messageReceivedByA: "Nachricht für Person A",
    messageReceivedByB: "Nachricht für Person B",
    transmissionLog: "Übertragungsprotokoll",
    original: "Original",
    translatedTo: "Übersetzt nach",
    personA: "Person A",
    personB: "Person B",
    typeTab: "⌨ Text",
    speakTab: "🎤 Sprechen",
    photoTab: "📷 Foto",

    liliBadge: "LILI VISUAL",
    liliTitle: "Text aus Kamera oder hochgeladenem Bild lesen",
    liliNote:
      "Nutzen Sie die Live-Kamera, nehmen Sie ein Bild auf oder laden Sie ein Bild hoch und extrahieren Sie den Text vor der Übersetzung.",
    liliSubNote:
      "Funktioniert am besten mit klar gedrucktem Text. Zeilenumbrüche und Abstände werden so gut wie möglich beibehalten.",
    liliLanguage: "Lili-Sprache",
    openCamera: "Kamera öffnen",
    closeCamera: "Kamera schließen",
    capturePhoto: "Foto aufnehmen",
    uploadImage: "Bild hochladen",
    imagePreview: "Bildvorschau",
    extractedText: "Extrahierter Text",
    translatedDocument: "Übersetztes Dokument",
    runLili: "Lili Visual starten",
    liliRunning: "Text wird gelesen...",
    copyToTranslator: "In Übersetzer kopieren",
    translateExtractedText: "Extrahierten Text übersetzen",
    noImageYet: "Noch kein Bild geladen.",
    savePdf: "Als PDF speichern",

    tips: "Hinweise",
    tipsText:
      "Kamerazugriff funktioniert normalerweise auf localhost und HTTPS. Der erste Lili-Visual-Scan kann sich etwas langsamer anfühlen, während OCR-Ressourcen geladen werden.",

    errorNoText: "Bitte zuerst Text eingeben.",
    errorPersonA: "Person A hat noch keinen Text.",
    errorPersonB: "Person B hat noch keinen Text.",
    errorNoImage: "Bitte zuerst ein Bild aufnehmen oder hochladen.",
    errorCamera:
      "Kamera konnte nicht geöffnet werden. Auf Mobilgeräten braucht das meist HTTPS oder localhost plus Kameraberechtigung.",
    errorSpeech:
      "Spracherkennung wird von diesem Browser nicht unterstützt.",
    errorOcr:
      "Lili Visual konnte dieses Bild nicht klar lesen. Bitte versuchen Sie es mit einem schärferen Bild.",
    errorTranslateService:
      "Der Übersetzungsdienst ist derzeit nicht verfügbar. Bitte versuchen Sie es in einem Moment erneut.",
    cameraNotReady:
      "Die Kamera ist noch nicht bereit. Bitte warten Sie eine Sekunde und versuchen Sie es erneut.",

    footer: "© Lobster Inc. / Jura Technology. Alle Rechte vorbehalten."
  }
} as const;

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    continuous: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  }

  interface SpeechRecognitionEvent {
    results: {
      [index: number]: {
        [index: number]: {
          transcript: string;
        };
      };
      length: number;
    };
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
  }
}

function mapSpeechLang(langCode: LanguageCode) {
  switch (langCode) {
    case "JA":
      return "ja-JP";
    case "ZH":
      return "zh-CN";
    case "RU":
      return "ru-RU";
    case "KO":
      return "ko-KR";
    case "SV":
      return "sv-SE";
    case "EN":
      return "en-US";
    case "FR":
      return "fr-FR";
    case "DE":
      return "de-DE";
    case "IT":
      return "it-IT";
    default:
      return "en-US";
  }
}

function mapOcrLang(code: LanguageCode) {
  switch (code) {
    case "JA":
      return "jpn";
    case "ZH":
      return "chi_sim";
    case "RU":
      return "rus";
    case "KO":
      return "kor";
    case "SV":
      return "eng";
    case "EN":
      return "eng";
    case "FR":
      return "fra";
    case "DE":
      return "deu";
    case "IT":
      return "ita";
    default:
      return "eng";
  }
}

function speakText(text: string, langCode: LanguageCode) {
  if (!("speechSynthesis" in window) || !text.trim()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = mapSpeechLang(langCode);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function buildPrintableHtml(title: string, original: string, translated: string) {
  return `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1 { font-size: 22px; margin-bottom: 20px; }
          h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
          .doc {
            white-space: pre-wrap;
            font-family: "Courier New", monospace;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 16px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <h2>Original</h2>
        <div class="doc">${original.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        <h2>Translated</h2>
        <div class="doc">${translated.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      </body>
    </html>
  `;
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);

  const [uiLang, setUiLang] = useState<UiLang | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const [mode, setMode] = useState<Mode>("translator");
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState(false);

  const [singleSourceLang, setSingleSourceLang] = useState("Auto-detect");
  const [singleTargetLang, setSingleTargetLang] = useState("French");
  const [singleSourceText, setSingleSourceText] = useState("");
  const [singleTranslatedText, setSingleTranslatedText] = useState("");

  const [convLangA, setConvLangA] = useState("Japanese");
  const [convLangB, setConvLangB] = useState("English");
  const [convTextA, setConvTextA] = useState("");
  const [convTextB, setConvTextB] = useState("");
  const [convTranslatedA, setConvTranslatedA] = useState("");
  const [convTranslatedB, setConvTranslatedB] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [commModeA, setCommModeA] = useState<CommInputMode>("type");
  const [commModeB, setCommModeB] = useState<CommInputMode>("type");

  const [ocrLang, setOcrLang] = useState("English");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrImage, setOcrImage] = useState<string>("");
  const [ocrExtractedText, setOcrExtractedText] = useState("");
  const [ocrTranslatedText, setOcrTranslatedText] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  const [isListeningSingle, setIsListeningSingle] = useState(false);
  const [isListeningA, setIsListeningA] = useState(false);
  const [isListeningB, setIsListeningB] = useState(false);

  const recognitionSingleRef = useRef<SpeechRecognition | null>(null);
  const recognitionARef = useRef<SpeechRecognition | null>(null);
  const recognitionBRef = useRef<SpeechRecognition | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputARef = useRef<HTMLInputElement | null>(null);
  const photoInputBRef = useRef<HTMLInputElement | null>(null);

  const t = UI[uiLang ?? "en"];

  useEffect(() => {
    setMounted(true);
    setSupportsSpeech(
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      recognitionSingleRef.current?.stop();
      recognitionARef.current?.stop();
      recognitionBRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    async function attachStreamToVideo() {
      if (cameraOpen && videoRef.current && streamRef.current) {
        try {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
          setWarning("");
        } catch {
          setWarning(t.errorCamera);
        }
      }
    }

    attachStreamToVideo();
  }, [cameraOpen, t.errorCamera]);

  async function translateText(text: string, source: LanguageCode, target: LanguageCode) {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text, source, target })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || t.errorTranslateService);
    }

    return data?.translated as string;
  }

  function safeTranslateError(error: unknown) {
    if (!(error instanceof Error)) return t.errorTranslateService;

    const msg = error.message.toLowerCase();

    if (
      msg.includes("forbidden") ||
      msg.includes("auth") ||
      msg.includes("deepl") ||
      msg.includes("key") ||
      msg.includes("unauthorized")
    ) {
      return t.errorTranslateService;
    }

    return error.message || t.errorTranslateService;
  }

  function clearSingleMode() {
    setSingleSourceText("");
    setSingleTranslatedText("");
    setWarning("");
  }

  function clearConversationMode() {
    setConvTextA("");
    setConvTextB("");
    setConvTranslatedA("");
    setConvTranslatedB("");
    setHistory([]);
    setWarning("");
    setCommModeA("type");
    setCommModeB("type");
  }

  function clearLiliMode() {
    setOcrImage("");
    setOcrExtractedText("");
    setOcrTranslatedText("");
    setWarning("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addToHistory(
    speaker: string,
    original: string,
    translated: string,
    targetLanguageName: string
  ) {
    if (!original.trim() || !translated.trim()) return;

    const nextItem: HistoryItem = {
      speaker,
      original,
      translated,
      targetLanguageName
    };

    setHistory((prev) => [nextItem, ...prev].slice(0, 10));
  }

  function stopRecognition(target: "single" | "a" | "b") {
    if (target === "single") {
      recognitionSingleRef.current?.stop();
      setIsListeningSingle(false);
    } else if (target === "a") {
      recognitionARef.current?.stop();
      setIsListeningA(false);
    } else {
      recognitionBRef.current?.stop();
      setIsListeningB(false);
    }
  }

  function startSpeechInput(
    target: "single" | "a" | "b",
    languageName: string,
    onTranscript: (value: string) => void
  ) {
    setWarning("");

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setWarning(t.errorSpeech);
      return;
    }

    stopRecognition("single");
    stopRecognition("a");
    stopRecognition("b");

    const recognition = new SpeechRecognitionClass();
    const langCode = LANGUAGE_CODE_BY_LABEL[languageName] || "EN";

    recognition.lang = mapSpeechLang(langCode);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        finalTranscript += event.results[i][0].transcript + " ";
      }
      onTranscript(finalTranscript.trim());
    };

    recognition.onerror = () => {
      setWarning(t.errorSpeech);
    };

    recognition.onend = () => {
      if (target === "single") setIsListeningSingle(false);
      if (target === "a") setIsListeningA(false);
      if (target === "b") setIsListeningB(false);
    };

    if (target === "single") {
      recognitionSingleRef.current = recognition;
      setIsListeningSingle(true);
    } else if (target === "a") {
      recognitionARef.current = recognition;
      setIsListeningA(true);
      setCommModeA("speak");
    } else {
      recognitionBRef.current = recognition;
      setIsListeningB(true);
      setCommModeB("speak");
    }

    recognition.start();
  }

  async function handleSingleTranslate() {
    setWarning("");
    setSingleTranslatedText("");

    const sourceText = singleSourceText.trim();
    if (!sourceText) {
      setWarning(t.errorNoText);
      return;
    }

    try {
      setBusy(true);
      const translated = await translateText(
        sourceText,
        LANGUAGE_CODE_BY_LABEL[singleSourceLang] || "auto",
        LANGUAGE_CODE_BY_LABEL[singleTargetLang] || "EN"
      );
      setSingleTranslatedText(translated);
    } catch (error) {
      setWarning(safeTranslateError(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleAToB() {
    setWarning("");
    setConvTranslatedA("");

    const original = convTextA.trim();
    if (!original) {
      setWarning(t.errorPersonA);
      return;
    }

    try {
      setBusy(true);
      const translated = await translateText(
        original,
        LANGUAGE_CODE_BY_LABEL[convLangA] || "auto",
        LANGUAGE_CODE_BY_LABEL[convLangB] || "EN"
      );
      setConvTranslatedA(translated);
      addToHistory(t.personA, original, translated, convLangB);
    } catch (error) {
      setWarning(safeTranslateError(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleBToA() {
    setWarning("");
    setConvTranslatedB("");

    const original = convTextB.trim();
    if (!original) {
      setWarning(t.errorPersonB);
      return;
    }

    try {
      setBusy(true);
      const translated = await translateText(
        original,
        LANGUAGE_CODE_BY_LABEL[convLangB] || "auto",
        LANGUAGE_CODE_BY_LABEL[convLangA] || "EN"
      );
      setConvTranslatedB(translated);
      addToHistory(t.personB, original, translated, convLangA);
    } catch (error) {
      setWarning(safeTranslateError(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleCommPhotoUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    side: "a" | "b"
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setWarning("");

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const result = reader.result;

        if (typeof result !== "string") {
          setWarning(t.errorOcr);
          return;
        }

        const worker = await createWorker(
          mapOcrLang(
            LANGUAGE_CODE_BY_LABEL[side === "a" ? convLangA : convLangB] || "EN"
          )
        );

        const ocr = await worker.recognize(result);
        await worker.terminate();

        const text = ocr.data.text?.trim() || "";

        if (side === "a") {
          setConvTextA(text);
          setCommModeA("photo");
        } else {
          setConvTextB(text);
          setCommModeB("photo");
        }
      } catch {
        setWarning(t.errorOcr);
      } finally {
        setBusy(false);
      }
    };

    reader.onerror = () => {
      setWarning(t.errorOcr);
      setBusy(false);
    };

    reader.readAsDataURL(file);
  }

  async function openCamera() {
    setWarning("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setWarning(t.errorCamera);
      setCameraOpen(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      setWarning(t.errorNoImage);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setWarning(t.cameraNotReady);
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/png");
    setOcrImage(dataUrl);
    setOcrExtractedText("");
    setOcrTranslatedText("");
  }

  function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setOcrImage(result);
        setOcrExtractedText("");
        setOcrTranslatedText("");
      }
    };
    reader.readAsDataURL(file);
  }

  async function runOcr() {
    setWarning("");
    setOcrExtractedText("");
    setOcrTranslatedText("");

    if (!ocrImage) {
      setWarning(t.errorNoImage);
      return;
    }

    try {
      setOcrBusy(true);
      const worker = await createWorker(
        mapOcrLang(LANGUAGE_CODE_BY_LABEL[ocrLang] || "EN")
      );
      const result = await worker.recognize(ocrImage);
      await worker.terminate();

      const text = result.data.text?.trim() || "";
      setOcrExtractedText(text);
    } catch {
      setWarning(t.errorOcr);
    } finally {
      setOcrBusy(false);
    }
  }

  async function translateExtractedText() {
    setWarning("");

    const sourceText = ocrExtractedText.trim();
    if (!sourceText) {
      setWarning(t.errorNoText);
      return;
    }

    try {
      setBusy(true);
      const translated = await translateText(
        sourceText,
        "auto",
        LANGUAGE_CODE_BY_LABEL[singleTargetLang] || "EN"
      );
      setOcrTranslatedText(translated);
      setSingleSourceText(sourceText);
      setSingleTranslatedText(translated);
    } catch (error) {
      setWarning(safeTranslateError(error));
    } finally {
      setBusy(false);
    }
  }

  function saveTranslatedAsPdf() {
    if (!ocrTranslatedText.trim()) {
      setWarning(t.errorNoText);
      return;
    }

    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;

    popup.document.open();
    popup.document.write(
      buildPrintableHtml(t.translatedDocument, ocrExtractedText, ocrTranslatedText)
    );
    popup.document.close();
    popup.focus();
    popup.print();
  }

  function chooseLanguage(lang: UiLang) {
    setUiLang(lang);
    setShowLanguagePicker(false);
  }

  if (!mounted) {
    return null;
  }

  return (
    <main className="page">
      {!uiLang && (
        <section className="brand-gate">
          <button
            type="button"
            className="logo-entry-button"
            onClick={() => setShowLanguagePicker((prev) => !prev)}
          >
            <div className="logo-entry-glow square-glow">
              <Image
                src="/blue_lobster.png"
                alt="Lobster Inc logo"
                width={120}
                height={120}
                className="logo-image"
                priority
              />
            </div>
          </button>

          <h1 className="brand-gate-title">Les Zouzous — Universal Family Translator</h1>
          <div className="brand-gate-subtitle">{t.chooseLanguage}</div>

          {showLanguagePicker && (
            <div className="flag-row">
              <button className="flag-button" onClick={() => chooseLanguage("en")}>
                🇬🇧 English
              </button>
              <button className="flag-button" onClick={() => chooseLanguage("fr")}>
                🇫🇷 Français
              </button>
              <button className="flag-button" onClick={() => chooseLanguage("de")}>
                🇩🇪 Deutsch
              </button>
            </div>
          )}
        </section>
      )}

      {uiLang && (
        <>
          <section className="hero hero-centered">
            <button
              type="button"
              className="hero-logo-button"
              onClick={() => setShowLanguagePicker((prev) => !prev)}
              aria-label="Open language selector"
            >
              <div className="logo-wrap logo-wrap-strong square-glow">
                <Image
                  src="/blue_lobster.png"
                  alt="Lobster Inc logo"
                  width={92}
                  height={92}
                  className="logo-image"
                  priority
                />
              </div>
            </button>

            <h1 className="hero-title">{t.appTitle}</h1>
            <p className="hero-blue-line">{t.appBlueLine}</p>
            <p className="hero-subtitle">{t.appSubtitle}</p>

            {showLanguagePicker && (
              <div className="flag-row compact">
                <button className="flag-button" onClick={() => chooseLanguage("en")}>
                  🇬🇧 English
                </button>
                <button className="flag-button" onClick={() => chooseLanguage("fr")}>
                  🇫🇷 Français
                </button>
                <button className="flag-button" onClick={() => chooseLanguage("de")}>
                  🇩🇪 Deutsch
                </button>
              </div>
            )}
          </section>

          <section className="card jura-card">
            <div className="section-title jura-heading">{t.juraTitle}</div>

            <div className="mode-row mode-row-large">
              <button
                className={`mode-button ${mode === "translator" ? "active" : ""}`}
                onClick={() => setMode("translator")}
              >
                {t.translator}
              </button>
              <button
                className={`mode-button ${mode === "communicator" ? "active" : ""}`}
                onClick={() => setMode("communicator")}
              >
                {t.communicator}
              </button>
              <button
                className={`mode-button ${mode === "lili_visual" ? "active" : ""}`}
                onClick={() => setMode("lili_visual")}
              >
                {t.liliVisual}
              </button>
            </div>
          </section>

          {mode === "translator" && (
            <section className="card spacious-card">
              <div className="section-badge">{t.translatorBadge}</div>
              <div className="section-title large-title">{t.translatorTitle}</div>
              <div className="section-note">{t.translatorNote}</div>

              <div className="grid-2 form-top-gap">
                <div>
                  <label htmlFor="single-source">{t.from}</label>
                  <select
                    id="single-source"
                    value={singleSourceLang}
                    onChange={(e) => setSingleSourceLang(e.target.value)}
                  >
                    {SOURCE_LANGUAGE_OPTIONS.map((language) => (
                      <option key={language.label} value={language.label}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="single-target">{t.to}</label>
                  <select
                    id="single-target"
                    value={singleTargetLang}
                    onChange={(e) => setSingleTargetLang(e.target.value)}
                  >
                    {TARGET_LANGUAGE_OPTIONS.map((language) => (
                      <option key={language.label} value={language.label}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="divider-line" />

              <div className="text-block">
                <label htmlFor="single-text">{t.writeYourText}</label>
                <textarea
                  id="single-text"
                  value={singleSourceText}
                  onChange={(e) => setSingleSourceText(e.target.value)}
                  placeholder={t.typeHere}
                />
              </div>

              {isListeningSingle && (
                <div className="listening-box">
                  <div className="listening-inline">
                    <span className="pulse-dot" />
                    <span>{t.listening}</span>
                  </div>
                </div>
              )}

              <div className="actions actions-large">
                <button className="primary-btn" onClick={handleSingleTranslate} disabled={busy}>
                  {busy ? "..." : t.translate}
                </button>

                <button className="secondary-btn" onClick={clearSingleMode}>
                  {t.clear}
                </button>

                {supportsSpeech && !isListeningSingle && (
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      startSpeechInput(
                        "single",
                        singleSourceLang === "Auto-detect" ? "English" : singleSourceLang,
                        setSingleSourceText
                      )
                    }
                  >
                    {t.startListening}
                  </button>
                )}

                {supportsSpeech && isListeningSingle && (
                  <button className="stop-btn" onClick={() => stopRecognition("single")}>
                    {t.stopListening}
                  </button>
                )}

                {singleTranslatedText && (
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      speakText(
                        singleTranslatedText,
                        LANGUAGE_CODE_BY_LABEL[singleTargetLang] || "EN"
                      )
                    }
                  >
                    {t.speakOut}
                  </button>
                )}
              </div>

              {warning && <div className="warning">{warning}</div>}

              {singleTranslatedText && (
                <div className="result">
                  <b>{t.translationIn} {singleTargetLang}</b>
                  <br />
                  <br />
                  {singleTranslatedText}
                </div>
              )}
            </section>
          )}

          {mode === "communicator" && (
            <>
              <section className="card spacious-card communicator-top-card">
                <div className="section-badge">{t.communicatorBadge}</div>
                <div className="section-title large-title">{t.communicatorTitle}</div>
                <div className="section-note">{t.communicatorNote}</div>

                <div className="grid-2 form-top-gap">
                  <div>
                    <label htmlFor="conv-lang-a">{t.personASpeaks}</label>
                    <select
                      id="conv-lang-a"
                      value={convLangA}
                      onChange={(e) => setConvLangA(e.target.value)}
                    >
                      {SOURCE_LANGUAGE_OPTIONS.map((language) => (
                        <option key={language.label} value={language.label}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="conv-lang-b">{t.personBSpeaks}</label>
                    <select
                      id="conv-lang-b"
                      value={convLangB}
                      onChange={(e) => setConvLangB(e.target.value)}
                    >
                      {SOURCE_LANGUAGE_OPTIONS.map((language) => (
                        <option key={language.label} value={language.label}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="actions actions-large communicator-top-actions">
                  <button
                    className="secondary-btn wide-btn"
                    onClick={() => {
                      const oldA = convLangA;
                      const oldB = convLangB;
                      setConvLangA(oldB);
                      setConvLangB(oldA);
                    }}
                  >
                    {t.swapLanguages}
                  </button>

                  <button className="secondary-btn wide-btn" onClick={clearConversationMode}>
                    {t.clearConversation}
                  </button>
                </div>
              </section>

              <div className="communicator-divider" />

              <section className="grid-communicator communicator-stations">
                <div className="card station-card">
                  <div className="station-pill" />
                  <div className="station-title">👤 {t.personA} ({convLangA})</div>

                  <div className="station-tabs">
                    <button
                      className={`station-tab ${commModeA === "type" ? "active" : ""}`}
                      onClick={() => setCommModeA("type")}
                    >
                      {t.typeTab}
                    </button>
                    <button
                      className={`station-tab ${commModeA === "speak" ? "active" : ""}`}
                      onClick={() => {
                        setCommModeA("speak");
                        if (!isListeningA) startSpeechInput("a", convLangA, setConvTextA);
                      }}
                    >
                      {t.speakTab}
                    </button>
                    <button
                      className={`station-tab ${commModeA === "photo" ? "active" : ""}`}
                      onClick={() => {
                        setCommModeA("photo");
                        photoInputARef.current?.click();
                      }}
                    >
                      {t.photoTab}
                    </button>
                    <input
                      ref={photoInputARef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleCommPhotoUpload(e, "a")}
                    />
                  </div>

                  <label htmlFor="conv-a">{t.writeYourText}</label>
                  <textarea
                    id="conv-a"
                    value={convTextA}
                    onChange={(e) => {
                      setConvTextA(e.target.value);
                      setCommModeA("type");
                    }}
                    placeholder={t.typeHere}
                  />

                  {isListeningA && (
                    <div className="listening-box compact-listening">
                      <div className="listening-inline">
                        <span className="pulse-dot" />
                        <span>{t.listening}</span>
                      </div>
                    </div>
                  )}

                  <div className="actions actions-large">
                    <button className="primary-btn wide-btn" onClick={handleAToB} disabled={busy}>
                      {busy ? t.routing : t.transmitAToB}
                    </button>

                    {supportsSpeech && isListeningA && (
                      <button className="stop-btn" onClick={() => stopRecognition("a")}>
                        {t.stopA}
                      </button>
                    )}

                    {convTranslatedA && (
                      <button
                        className="secondary-btn"
                        onClick={() =>
                          speakText(
                            convTranslatedA,
                            LANGUAGE_CODE_BY_LABEL[convLangB] || "EN"
                          )
                        }
                      >
                        {t.speakToB}
                      </button>
                    )}
                  </div>

                  {convTranslatedA && (
                    <div className="result">
                      <b>{t.messageReceivedByB}</b>
                      <br />
                      <br />
                      {convTranslatedA}
                    </div>
                  )}
                </div>

                <div className="card station-card">
                  <div className="station-pill" />
                  <div className="station-title">👤 {t.personB} ({convLangB})</div>

                  <div className="station-tabs">
                    <button
                      className={`station-tab ${commModeB === "type" ? "active" : ""}`}
                      onClick={() => setCommModeB("type")}
                    >
                      {t.typeTab}
                    </button>
                    <button
                      className={`station-tab ${commModeB === "speak" ? "active" : ""}`}
                      onClick={() => {
                        setCommModeB("speak");
                        if (!isListeningB) startSpeechInput("b", convLangB, setConvTextB);
                      }}
                    >
                      {t.speakTab}
                    </button>
                    <button
                      className={`station-tab ${commModeB === "photo" ? "active" : ""}`}
                      onClick={() => {
                        setCommModeB("photo");
                        photoInputBRef.current?.click();
                      }}
                    >
                      {t.photoTab}
                    </button>
                    <input
                      ref={photoInputBRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleCommPhotoUpload(e, "b")}
                    />
                  </div>

                  <label htmlFor="conv-b">{t.writeYourText}</label>
                  <textarea
                    id="conv-b"
                    value={convTextB}
                    onChange={(e) => {
                      setConvTextB(e.target.value);
                      setCommModeB("type");
                    }}
                    placeholder={t.typeHere}
                  />

                  {isListeningB && (
                    <div className="listening-box compact-listening">
                      <div className="listening-inline">
                        <span className="pulse-dot" />
                        <span>{t.listening}</span>
                      </div>
                    </div>
                  )}

                  <div className="actions actions-large">
                    <button className="primary-btn wide-btn" onClick={handleBToA} disabled={busy}>
                      {busy ? t.routing : t.transmitBToA}
                    </button>

                    {supportsSpeech && isListeningB && (
                      <button className="stop-btn" onClick={() => stopRecognition("b")}>
                        {t.stopB}
                      </button>
                    )}

                    {convTranslatedB && (
                      <button
                        className="secondary-btn"
                        onClick={() =>
                          speakText(
                            convTranslatedB,
                            LANGUAGE_CODE_BY_LABEL[convLangA] || "EN"
                          )
                        }
                      >
                        {t.speakToA}
                      </button>
                    )}
                  </div>

                  {convTranslatedB && (
                    <div className="result">
                      <b>{t.messageReceivedByA}</b>
                      <br />
                      <br />
                      {convTranslatedB}
                    </div>
                  )}
                </div>
              </section>

              {warning && <div className="warning">{warning}</div>}

              {history.length > 0 && (
                <section className="card spacious-card">
                  <div className="section-title medium-title">{t.transmissionLog}</div>
                  {history.map((item, index) => (
                    <div className="log-item" key={`${item.speaker}-${index}`}>
                      <b>{item.speaker}</b>
                      <div className="small">{t.original}</div>
                      <div>{item.original}</div>
                      <div className="small log-gap">
                        {t.translatedTo} {item.targetLanguageName}
                      </div>
                      <div>{item.translated}</div>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}

          {mode === "lili_visual" && (
            <>
              <section className="card spacious-card">
                <div className="section-badge">{t.liliBadge}</div>
                <div className="section-title large-title">{t.liliTitle}</div>
                <div className="section-note">{t.liliNote}</div>
                <div className="section-subnote">{t.liliSubNote}</div>

                <div className="grid-2 form-top-gap">
                  <div>
                    <label htmlFor="ocr-lang">{t.liliLanguage}</label>
                    <select
                      id="ocr-lang"
                      value={ocrLang}
                      onChange={(e) => setOcrLang(e.target.value)}
                    >
                      {SOURCE_LANGUAGE_OPTIONS.map((language) => (
                        <option key={language.label} value={language.label}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>{t.uploadImage}</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadChange}
                    />
                  </div>
                </div>

                <div className="actions actions-large">
                  {!cameraOpen ? (
                    <button className="secondary-btn" onClick={openCamera}>
                      {t.openCamera}
                    </button>
                  ) : (
                    <>
                      <button className="secondary-btn" onClick={stopCamera}>
                        {t.closeCamera}
                      </button>
                      <button className="primary-btn" onClick={capturePhoto}>
                        {t.capturePhoto}
                      </button>
                    </>
                  )}

                  <button className="secondary-btn" onClick={clearLiliMode}>
                    {t.clear}
                  </button>
                </div>

                {cameraOpen && (
                  <div className="camera-panel">
                    <video
                      ref={videoRef}
                      className="camera-video"
                      playsInline
                      muted
                      autoPlay
                    />
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                  </div>
                )}

                {warning && <div className="warning">{warning}</div>}
              </section>

              <section className="card spacious-card">
                <div className="section-title medium-title">{t.imagePreview}</div>

                {ocrImage ? (
                  <div className="ocr-preview-wrap">
                    <img src={ocrImage} alt="Lili preview" className="ocr-preview" />
                  </div>
                ) : (
                  <div className="small">{t.noImageYet}</div>
                )}

                <div className="actions actions-large">
                  <button className="primary-btn" onClick={runOcr} disabled={ocrBusy}>
                    {ocrBusy ? t.liliRunning : t.runLili}
                  </button>

                  {ocrExtractedText && (
                    <>
                      <button
                        className="secondary-btn"
                        onClick={() => {
                          setSingleSourceText(ocrExtractedText);
                          setMode("translator");
                        }}
                      >
                        {t.copyToTranslator}
                      </button>

                      <button
                        className="secondary-btn"
                        onClick={translateExtractedText}
                        disabled={busy}
                      >
                        {busy ? "..." : t.translateExtractedText}
                      </button>
                    </>
                  )}
                </div>
              </section>

              <section className="card spacious-card">
                <div className="section-title medium-title">{t.extractedText}</div>
                <pre className="document-preview">{ocrExtractedText || t.typeHere}</pre>
              </section>

              {ocrTranslatedText && (
                <section className="card spacious-card">
                  <div className="section-title medium-title">{t.translatedDocument}</div>
                  <pre className="document-preview translated-preview">
                    {ocrTranslatedText}
                  </pre>

                  <div className="actions actions-large">
                    <button className="secondary-btn" onClick={saveTranslatedAsPdf}>
                      {t.savePdf}
                    </button>
                  </div>
                </section>
              )}
            </>
          )}

          <footer className="app-footer">{t.footer}</footer>
        </>
      )}
    </main>
  );
}