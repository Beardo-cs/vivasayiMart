import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const VOICE_LANG = { ta: 'ta-IN', en: 'en-IN' };
const RATES = [0.75, 1, 1.25];
const norm = lang => (lang || '').replace('_', '-').toLowerCase();

const speechOf = () =>
  (typeof window !== 'undefined' && window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function'
    ? window.speechSynthesis
    : null);

// Reads `linesFor(lang)` one sentence at a time, so pause and resume work on every phone
// (Android ignores speechSynthesis.pause) and long text isn't cut off.
const ListenControls = ({ linesFor }) => {
  const { t, i18n } = useTranslation();
  const [synth] = useState(speechOf);
  const [voices, setVoices] = useState(() => (synth ? synth.getVoices() : []));
  const [lang, setLang] = useState(i18n.language === 'ta' ? 'ta' : 'en');
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState('idle');
  const [current, setCurrent] = useState(-1);
  const [problem, setProblem] = useState(null);
  const [showText, setShowText] = useState(!synth);
  const runRef = useRef(0);
  const posRef = useRef(0);

  useEffect(() => {
    if (!synth) return undefined;
    const update = () => setVoices(synth.getVoices());
    synth.addEventListener('voiceschanged', update);
    return () => {
      synth.removeEventListener('voiceschanged', update);
      runRef.current += 1;
      synth.cancel();
    };
  }, [synth]);

  const lines = linesFor(lang);
  const voice = voices.find(v => norm(v.lang) === norm(VOICE_LANG[lang])) || voices.find(v => norm(v.lang).startsWith(lang));

  const stop = () => {
    runRef.current += 1;
    if (synth) synth.cancel();
    posRef.current = 0;
    setStatus('idle');
    setCurrent(-1);
  };

  const speakFrom = start => {
    if (voices.length && !voice) {
      setProblem('noVoice');
      setShowText(true);
      return;
    }
    const run = ++runRef.current;
    const say = i => {
      if (run !== runRef.current) return;
      if (i >= lines.length) {
        posRef.current = 0;
        setStatus('idle');
        setCurrent(-1);
        return;
      }
      posRef.current = i;
      setCurrent(i);
      const u = new window.SpeechSynthesisUtterance(lines[i]);
      u.lang = VOICE_LANG[lang];
      if (voice) u.voice = voice;
      u.rate = rate;
      u.onend = () => say(i + 1);
      u.onerror = () => {
        if (run !== runRef.current) return;
        stop();
        setProblem('failed');
        setShowText(true);
      };
      synth.speak(u);
    };
    setProblem(null);
    setStatus('playing');
    // Chrome can stay silent when speak() follows cancel() straight away.
    if (synth.speaking || synth.pending) {
      synth.cancel();
      setTimeout(() => say(start), 80);
    } else {
      say(start);
    }
  };

  const pause = () => {
    runRef.current += 1;
    synth.cancel();
    setStatus('paused');
  };

  const change = setter => e => {
    stop();
    setProblem(null);
    setter(e.target.value);
  };

  const note = !synth
    ? t('cropHealth.listen.unavailable')
    : problem && t(`cropHealth.listen.${problem}`, { lang: t(`cropHealth.listen.languages.${lang}`) });

  return (
    <section className="ai-listen" aria-label={t('cropHealth.listen.listen')}>
      {synth && (
        <div className="ai-listen-main">
          {status === 'playing' && (
            <button type="button" className="btn btn-primary" onClick={pause}>
              <i className="fas fa-pause" aria-hidden="true"></i> {t('cropHealth.listen.pause')}
            </button>
          )}
          {status === 'paused' && (
            <button type="button" className="btn btn-primary" onClick={() => speakFrom(posRef.current)}>
              <i className="fas fa-play" aria-hidden="true"></i> {t('cropHealth.listen.resume')}
            </button>
          )}
          {status === 'idle' && (
            <button type="button" className="btn btn-primary" onClick={() => speakFrom(0)}>
              <i className="fas fa-volume-up" aria-hidden="true"></i> {t('cropHealth.listen.listen')}
            </button>
          )}
          {status !== 'idle' && (
            <button type="button" className="btn btn-light" onClick={() => speakFrom(0)}>
              <i className="fas fa-redo" aria-hidden="true"></i> {t('cropHealth.listen.replay')}
            </button>
          )}
        </div>
      )}
      <div className="ai-listen-options">
        <label>
          {t('cropHealth.listen.language')}
          <select value={lang} onChange={change(setLang)}>
            <option value="ta">தமிழ்</option>
            <option value="en">English</option>
          </select>
        </label>
        {synth && (
          <label>
            {t('cropHealth.listen.speed')}
            <select value={rate} onChange={change(v => setRate(Number(v)))}>
              {RATES.map(r => <option key={r} value={r}>{r}×</option>)}
            </select>
          </label>
        )}
        <button type="button" className="ai-link" aria-expanded={showText} onClick={() => setShowText(s => !s)}>
          {showText ? t('cropHealth.listen.hideText') : t('cropHealth.listen.showText')}
        </button>
      </div>
      {note && <p className="ai-warn" role="status">{note}</p>}
      {showText && (
        <ol className="ai-transcript" lang={lang}>
          {lines.map((line, i) => <li key={i} className={i === current ? 'on' : undefined}>{line}</li>)}
        </ol>
      )}
    </section>
  );
};

export default ListenControls;
