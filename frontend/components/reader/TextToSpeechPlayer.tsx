'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  estimateDurationSeconds,
  getSpeechVoices,
  loadTtsPosition,
  loadTtsPreferences,
  resetTtsPreferences,
  saveTtsPosition,
  saveTtsPreferences,
  splitTtsBlocks,
  syncTtsPreferences,
  syncTtsProgress,
  type TtsPosition,
  type TtsSpeed,
} from '@/services/ttsService';

type Props = {
  courseId: string;
  part: number;
  title?: string;
  module?: string;
  markdown: string;
  onNext?: () => void;
  onActiveText?: (text: string) => void;
  onActivePosition?: (index: number, total: number) => void;
  rate?: TtsSpeed;
  onRateChange?: (rate: TtsSpeed) => void;
};

type PlayerState = 'idle' | 'playing' | 'paused' | 'ended';

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function TextToSpeechPlayer({ courseId, part, title, module, markdown, onNext, onActiveText, onActivePosition, rate: controlledRate, onRateChange }: Props) {
  const [spokenScript, setSpokenScript] = useState(markdown);
  const [expertMode, setExpertMode] = useState(true);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [expertExplanationReady, setExpertExplanationReady] = useState(false);
  const blocks = useMemo(() => splitTtsBlocks(spokenScript), [spokenScript]);
  const [state, setState] = useState<PlayerState>('idle');
  const [blockIndex, setBlockIndex] = useState(0);
  const [internalRate, setInternalRate] = useState<TtsSpeed>(() => loadTtsPreferences().rate);
  const rate = controlledRate ?? internalRate;
  const setRate = (nextRate: TtsSpeed) => { setInternalRate(nextRate); onRateChange?.(nextRate); };
  const [pitch, setPitch] = useState(() => loadTtsPreferences().pitch);
  const [volume, setVolume] = useState(() => loadTtsPreferences().volume);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState(() => loadTtsPreferences().voiceName);
  const [activeText, setActiveText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const blockIndexRef = useRef(0);
  const speechRunRef = useRef(0);
  const hasStartedRef = useRef(false);
  const positionRef = useRef<TtsPosition>({ blockIndex: 0, progress: 0 });
  const preferredVoice = useMemo(() => {
    const preferredNames = ['Microsoft Jenny', 'Google UK English Female', 'Google US English Female', 'Samantha', 'Microsoft Aria', 'Alex'];
    return preferredNames.map(name => voices.find(voice => voice.name.toLowerCase().includes(name.toLowerCase()))).find(Boolean)
      || voices.find(voice => /^en(-|_)/i.test(voice.lang))
      || voices[0];
  }, [voices]);

  useEffect(() => {
    const applyPreference = (event: Event) => {
      const detail = (event as CustomEvent<{ voiceName?: string; rate?: TtsSpeed; pitch?: number; volume?: number }>).detail || {};
      if (typeof detail.voiceName === 'string') setVoiceName(detail.voiceName);
      if (typeof detail.rate === 'number') setRate(detail.rate);
      if (typeof detail.pitch === 'number') setPitch(detail.pitch);
      if (typeof detail.volume === 'number') setVolume(detail.volume);
    };
    window.addEventListener('tts-preference-change', applyPreference);
    return () => window.removeEventListener('tts-preference-change', applyPreference);
  }, [onRateChange]);

  useEffect(() => {
    let cancelled = false;
    setSpokenScript(markdown);
    setExpertExplanationReady(false);
    if (!expertMode) return () => { cancelled = true; };
    const explain = async () => {
      setExplanationLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
        const response = await fetch(`${base}/api/ai/explain-lesson`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson: { course: courseId, module: module || 'Current module', title: title || `Part ${part}`, notes: markdown } }) });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && typeof data.answer === 'string' && data.answer.trim()) { setSpokenScript(data.answer); setExpertExplanationReady(true); }
      } catch { /* original notes remain the fallback */ }
      finally { if (!cancelled) setExplanationLoading(false); }
    };
    void explain();
    return () => { cancelled = true; };
  }, [courseId, expertMode, markdown, module, part, title]);

  const duration = useMemo(() => blocks.reduce((sum, block) => sum + estimateDurationSeconds(block.text, rate), 0), [blocks, rate]);
  const elapsed = useMemo(() => blocks.slice(0, blockIndex).reduce((sum, block) => sum + estimateDurationSeconds(block.text, rate), 0), [blocks, blockIndex, rate]);
  const progress = duration ? Math.min(1, elapsed / duration) : 0;

  const persistPosition = useCallback((nextBlockIndex: number, nextProgress = 0) => {
    const position = { blockIndex: Math.max(0, Math.min(blocks.length - 1, nextBlockIndex)), progress: nextProgress };
    positionRef.current = position;
    saveTtsPosition(courseId, part, position);
    void syncTtsProgress(courseId, part, position);
  }, [blocks.length, courseId, part]);

  const speakBlock = useCallback((index: number) => {
    if (!blocks[index] || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const runId = speechRunRef.current + 1;
    speechRunRef.current = runId;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(blocks[index].text);
    const voice = voices.find(item => item.name === voiceName) || preferredVoice;
    if (voice) utterance.voice = voice;
    utterance.rate = Math.min(2, rate * 0.96);
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.onstart = () => { hasStartedRef.current = true; setState('playing'); setActiveText(blocks[index].text); onActiveText?.(blocks[index].text); onActivePosition?.(index, blocks.length); };
    utterance.onend = () => {
      if (speechRunRef.current !== runId || blockIndexRef.current !== index) return;
      const next = index + 1;
      if (next < blocks.length) {
        blockIndexRef.current = next;
        setBlockIndex(next);
        persistPosition(next);
        window.setTimeout(() => { if (speechRunRef.current === runId) speakBlock(next); }, 80);
      } else {
        persistPosition(0);
        setState('ended');
        setActiveText('');
        onActiveText?.('');
        onActivePosition?.(-1, blocks.length);
        onNext?.();
      }
    };
    utterance.onerror = event => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') { setState('idle'); setActiveText(''); onActiveText?.(''); onActivePosition?.(-1, blocks.length); }
    };
    utteranceRef.current = utterance;
    blockIndexRef.current = index;
    setBlockIndex(index);
    persistPosition(index);
    window.speechSynthesis.speak(utterance);
  }, [blocks, onActivePosition, onActiveText, onNext, persistPosition, pitch, preferredVoice, rate, voiceName, voices, volume]);

  useEffect(() => {
    if (!hasStartedRef.current || state !== 'playing' || explanationLoading) return;
    const timer = window.setTimeout(() => speakBlock(blockIndexRef.current), 80);
    return () => window.clearTimeout(timer);
  }, [pitch, rate, voiceName, volume]);

  useEffect(() => {
    const available = getSpeechVoices();
    setUnsupported(typeof window === 'undefined' || !('speechSynthesis' in window));
    setVoices(available);
    const updateVoices = () => setVoices(getSpeechVoices());
    window.speechSynthesis?.addEventListener?.('voiceschanged', updateVoices);
    const saved = loadTtsPosition(courseId, part);
    const safeIndex = Math.min(saved.blockIndex, Math.max(0, blocks.length - 1));
    blockIndexRef.current = safeIndex;
    setBlockIndex(safeIndex);
    positionRef.current = { ...saved, blockIndex: safeIndex };
    return () => {
      window.speechSynthesis?.removeEventListener?.('voiceschanged', updateVoices);
      speechRunRef.current += 1;
      window.speechSynthesis?.cancel();
      setActiveText('');
      onActiveText?.('');
      onActivePosition?.(-1, blocks.length);
    };
  }, [blocks.length, courseId, onActiveText, part]);

  useEffect(() => {
    saveTtsPreferences({ voiceName, rate, pitch, volume });
    void syncTtsPreferences({ voiceName, rate, volume });
  }, [pitch, rate, voiceName, volume]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.altKey && event.key.toLowerCase() === 'l') { event.preventDefault(); state === 'playing' ? window.speechSynthesis.pause() : speakBlock(blockIndexRef.current); setState(state === 'playing' ? 'paused' : 'playing'); }
      if (event.altKey && event.key === ' ') { event.preventDefault(); if (state === 'playing') { window.speechSynthesis.pause(); setState('paused'); } else if (state === 'paused') { window.speechSynthesis.resume(); setState('playing'); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [speakBlock, state]);

  const toggle = () => {
    if (unsupported || blocks.length === 0) return;
    if (state === 'playing') { window.speechSynthesis.pause(); setState('paused'); return; }
    if (state === 'paused') { window.speechSynthesis.resume(); setState('playing'); return; }
    speakBlock(blockIndexRef.current);
  };

  const stop = () => { speechRunRef.current += 1; window.speechSynthesis.cancel(); setState('idle'); setActiveText(''); onActiveText?.(''); persistPosition(blockIndexRef.current); };
  const jumpToBlock = (next: number) => {
    const safeNext = Math.max(0, Math.min(blocks.length - 1, next));
    blockIndexRef.current = safeNext;
    setBlockIndex(safeNext);
    persistPosition(safeNext);
    if (state === 'playing' || state === 'paused') speakBlock(safeNext);
  };
  const jumpSeconds = (seconds: number) => {
    const target = Math.max(0, Math.min(duration, elapsed + seconds));
    let accumulated = 0;
    let targetBlock = 0;
    for (let index = 0; index < blocks.length; index += 1) {
      const blockDuration = estimateDurationSeconds(blocks[index].text, rate);
      if (accumulated + blockDuration >= target) { targetBlock = index; break; }
      accumulated += blockDuration;
      targetBlock = index;
    }
    jumpToBlock(targetBlock);
  };
  const seek = (value: number) => {
    const target = value * duration;
    let accumulated = 0;
    let targetBlock = 0;
    for (let index = 0; index < blocks.length; index += 1) {
      const blockDuration = estimateDurationSeconds(blocks[index].text, rate);
      if (accumulated + blockDuration >= target) { targetBlock = index; break; }
      accumulated += blockDuration;
      targetBlock = index;
    }
    jumpToBlock(targetBlock);
  };
  const resetDefaults = () => {
    const defaults = resetTtsPreferences();
    setVoiceName(defaults.voiceName);
    setRate(defaults.rate);
    setPitch(defaults.pitch);
    setVolume(defaults.volume);
    setExpertMode(true);
  };
  return (
    <section className="rd-tts" aria-label="AI voice reader">
      <div className="rd-tts__topline"><div><span className="rd-tts__eyebrow">VOICE READER</span><strong>{unsupported ? 'Browser speech unavailable' : expertMode ? 'Expert tutor explanation' : 'Listen to this lesson'}</strong></div><div className="rd-tts__topline-actions"><button type="button" className={`rd-tts__expert-toggle${expertMode ? ' active' : ''}`} onClick={() => setExpertMode(value => !value)} aria-pressed={expertMode}>{expertMode ? 'EXPERT ON' : 'READ NOTES'}</button><span className="rd-tts__estimate">≈ {formatTime(duration)} listen</span></div></div>
      <div className="rd-tts__progress-row"><input aria-label="Voice reader position" type="range" min="0" max="1" step="0.001" value={progress} onChange={event => seek(Number(event.target.value))} /><span>{formatTime(elapsed)} / {formatTime(duration)}</span></div>
      <div className="rd-tts__controls">
        <button type="button" onClick={() => jumpSeconds(-10)} disabled={blocks.length === 0} aria-label="Rewind 10 seconds">↶ <span>10</span></button>
        <button type="button" className="rd-tts__play" onClick={toggle} disabled={unsupported || blocks.length === 0} aria-label={state === 'playing' ? 'Pause reading' : 'Listen to lesson'}>{state === 'playing' ? 'Ⅱ' : '▶'}</button>
        <button type="button" onClick={() => jumpSeconds(10)} disabled={blocks.length === 0} aria-label="Skip forward 10 seconds"><span>10</span> ↷</button>
        <button type="button" onClick={stop} disabled={state === 'idle'} aria-label="Stop reading">■</button>
        <button type="button" className="rd-tts__settings" onClick={() => setShowSettings(value => !value)} aria-expanded={showSettings} aria-label="Voice settings">⚙</button>
      </div>
      {showSettings && <div className="rd-tts__settings-panel"><label>Voice<select value={voiceName} onChange={event => setVoiceName(event.target.value)}><option value="">Best available natural voice</option>{voices.map(voice => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}</option>)}</select></label><label>Pitch<input type="range" min="0.85" max="1.15" step="0.01" value={pitch} onChange={event => setPitch(Number(event.target.value))} /></label><label>Volume<input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => setVolume(Number(event.target.value))} /></label><button type="button" className="rd-tts__reset" onClick={resetDefaults}>RESET DEFAULTS</button><small>Default: best English voice · pitch 1.00 · speed 1x · full volume · Expert mode</small></div>}
      <div className="rd-tts__now" aria-live="polite"><span>NOW SPEAKING</span><strong>{activeText || 'Press Listen to begin'}</strong></div>
      <p className="rd-tts__status" aria-live="polite">{explanationLoading ? 'Preparing an expert explanation…' : state === 'playing' ? `Teaching sentence ${blockIndex + 1} of ${blocks.length}` : state === 'paused' ? 'Paused' : state === 'ended' ? 'Lesson complete — moving to the next lesson' : expertMode && expertExplanationReady ? 'Expert explanation ready' : 'Ready when you are'}</p>
    </section>
  );
}
