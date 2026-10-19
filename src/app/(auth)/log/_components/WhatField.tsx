import { Microphone } from '@/components/icons';
import { noticeCopy } from './noticeCopy';

export interface VoiceControls {
  isRecording: boolean;
  isTranscribing: boolean;
  /** Live mic input level, 0–1, while recording. Drives the "receiving audio" bars. */
  audioLevel: number;
  supported: boolean;
  onStart: () => void;
  onStop: () => void;
}

interface WhatFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  voice: VoiceControls;
}

/**
 * "What happened?" — the serif textarea with the voice control inside the box
 * (bottom-right): level bars while recording, spinner while transcribing, and
 * a muted "Listening…" / "Transcribing…" line beneath. Voice behaviour is
 * carried over unchanged from the previous Logger (D-LPS-12).
 */
export function WhatField({ value, onChange, placeholder, voice }: WhatFieldProps) {
  const { isRecording, isTranscribing, audioLevel, supported, onStart, onStop } = voice;
  return (
    <section>
      <h2 className="heading mb-sm font-serif text-base font-semibold text-text-primary">
        {noticeCopy.what}
      </h2>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={noticeCopy.what}
          rows={4}
          className="w-full min-h-[100px] rounded-lg border border-border-subtle bg-surface-input px-md pt-md pb-[52px] font-serif text-base text-text-primary leading-[1.7] placeholder:text-text-muted focus:border-ember focus:outline-none focus:shadow-focus transition-[border-color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-default)] resize-none"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-xs">
          {/* Live audio-level bars — visible while recording. They sit at a
              small floor (so "armed/live" reads even in silence) and grow with
              the mic level, which is the "receiving audio" signal. */}
          {isRecording && (
            <span className="flex h-[18px] items-center gap-[2px]" aria-hidden="true">
              {[0, 1, 2].map((i) => {
                const floor = 0.28;
                const gain = i === 1 ? 1 : 0.7;
                const scale = Math.max(floor, Math.min(1, floor + audioLevel * gain));
                return (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-ember origin-center transition-transform duration-[var(--motion-instant)] ease-[var(--ease-out)]"
                    style={{ height: '18px', transform: `scaleY(${scale})` }}
                  />
                );
              })}
            </span>
          )}
          <button
            type="button"
            onClick={isRecording ? onStop : onStart}
            disabled={!supported || isTranscribing}
            aria-pressed={isRecording}
            aria-label={
              isTranscribing
                ? noticeCopy.voiceTranscribing
                : isRecording
                  ? noticeCopy.voiceStop
                  : noticeCopy.voiceStart
            }
            title={supported ? undefined : noticeCopy.voiceUnsupportedTitle}
            className={`relative flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-default)] before:absolute before:-inset-1 before:content-[''] ${
              isRecording
                ? 'bg-ember text-text-inverse shadow-ember'
                : 'bg-surface-raised border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary'
            } ${isTranscribing ? 'hearth-thinking' : ''} disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border-subtle disabled:hover:text-text-muted`}
          >
            <Microphone size={18} weight={isRecording ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
        </div>
      </div>
      {(isRecording || isTranscribing || value.length > 0) && (
        <div className="mt-xs flex items-center justify-between font-sans text-[0.6875rem] text-text-muted">
          <span aria-live="polite">
            {isTranscribing ? noticeCopy.transcribing : isRecording ? noticeCopy.listening : ''}
          </span>
          <span>{value.length > 0 ? `${value.length}` : ''}</span>
        </div>
      )}
    </section>
  );
}
