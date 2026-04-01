import React, { forwardRef } from 'react';
import styled, { keyframes } from 'styled-components';

const VoiceButton = forwardRef(
  ({ state = 'idle', onPress, disabled, className, ...props }, ref) => {
    const isRecording = state === 'recording';
    const isProcessing = state === 'processing';
    const isSuccess = state === 'success';
    const isError = state === 'error';
    const isDisabled = disabled || isProcessing;

    const getLabel = () => {
      if (isRecording) return 'Tap to stop';
      if (isProcessing) return 'Transcribing…';
      if (isSuccess) return 'Done!';
      if (isError) return 'Try again';
      return 'Voice';
    };

    return (
      <StyledWrapper $state={state} className={className}>
        <button
          ref={ref}
          type="button"
          className="animated-button"
          onClick={onPress}
          disabled={isDisabled}
          aria-label={getLabel()}
          {...props}
        >
          {/* Left icon (slides in on hover) */}
          <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
            {isRecording ? (
              /* Stop / square icon */
              <rect x="6" y="6" width="12" height="12" rx="2" />
            ) : isSuccess ? (
              /* Check icon */
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            ) : isError ? (
              /* X icon */
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            ) : (
              /* Mic icon */
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            )}
          </svg>

          <span className="text">{getLabel()}</span>
          <span className="circle" />

          {/* Right icon (slides out on hover) */}
          <svg viewBox="0 0 24 24" className="arr-1" xmlns="http://www.w3.org/2000/svg">
            {isRecording ? (
              <rect x="6" y="6" width="12" height="12" rx="2" />
            ) : isSuccess ? (
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            ) : isError ? (
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            ) : (
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            )}
          </svg>

          {/* Pulse ring when recording */}
          {isRecording && <span className="pulse-ring" />}
        </button>
      </StyledWrapper>
    );
  }
);

VoiceButton.displayName = 'VoiceButton';

const pulseRing = keyframes`
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const StyledWrapper = styled.div`
  .animated-button {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 24px;
    border: 3px solid transparent;
    font-size: 13px;
    background-color: inherit;
    border-radius: 100px;
    font-weight: 600;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
    flex-shrink: 0;
    white-space: nowrap;

    /* State-based colors */
    color: ${({ $state }) =>
      $state === 'recording'
        ? '#ef4444'
        : $state === 'success'
          ? '#10b981'
          : $state === 'error'
            ? '#ef4444'
            : '#111111'};

    box-shadow: 0 0 0 2px ${({ $state }) =>
      $state === 'recording'
        ? '#ef4444'
        : $state === 'success'
          ? '#10b981'
          : $state === 'error'
            ? '#ef4444'
            : '#111111'};
  }

  .animated-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .animated-button svg {
    position: absolute;
    width: 20px;
    height: 20px;
    z-index: 9;
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);

    fill: ${({ $state }) =>
      $state === 'recording'
        ? '#ef4444'
        : $state === 'success'
          ? '#10b981'
          : $state === 'error'
            ? '#ef4444'
            : '#111111'};
  }

  .animated-button .arr-1 {
    right: 12px;
  }

  .animated-button .arr-2 {
    left: -25%;
  }

  .animated-button .circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    opacity: 0;
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);

    background-color: ${({ $state }) =>
      $state === 'recording'
        ? '#ef4444'
        : $state === 'success'
          ? '#10b981'
          : $state === 'error'
            ? '#ef4444'
            : '#111111'};
  }

  .animated-button .text {
    position: relative;
    z-index: 1;
    transform: translateX(-8px);
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .animated-button .pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #ef4444;
    animation: ${pulseRing} 1.5s ease-out infinite;
    z-index: 0;
    pointer-events: none;
  }

  .animated-button:hover:not(:disabled) {
    box-shadow: 0 0 0 12px transparent;
    color: white;
    border-radius: 12px;
  }

  .animated-button:hover:not(:disabled) .arr-1 {
    right: -25%;
  }

  .animated-button:hover:not(:disabled) .arr-2 {
    left: 12px;
  }

  .animated-button:hover:not(:disabled) .text {
    transform: translateX(8px);
  }

  .animated-button:hover:not(:disabled) svg {
    fill: white;
  }

  .animated-button:active:not(:disabled) {
    scale: 0.95;
    box-shadow: 0 0 0 4px ${({ $state }) =>
      $state === 'recording'
        ? '#ef4444'
        : $state === 'success'
          ? '#10b981'
          : $state === 'error'
            ? '#ef4444'
            : '#111111'};
  }

  .animated-button:hover:not(:disabled) .circle {
    width: 220px;
    height: 220px;
    opacity: 1;
  }
`;

export default VoiceButton;
