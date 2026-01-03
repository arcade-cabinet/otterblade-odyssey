/**
 * Loading Screen Component
 *
 * Displays while manifests are being preloaded.
 * Shows progress and provides user feedback during initialization.
 */

import { Show } from 'solid-js';

export default function LoadingScreen(props) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #2C1810 0%, #1A0F08 100%)',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        'z-index': 9999,
        color: '#D4A574',
        'font-family': "'Crimson Pro', Georgia, serif",
      }}
    >
      {/* Title */}
      <div
        style={{
          'font-size': '3rem',
          'font-weight': 'bold',
          'margin-bottom': '2rem',
          'text-shadow': '0 0 20px rgba(212, 165, 116, 0.5)',
          'letter-spacing': '0.1em',
        }}
      >
        Otterblade Odyssey
      </div>

      {/* Loading indicator */}
      <div
        style={{
          width: '300px',
          height: '4px',
          background: 'rgba(212, 165, 116, 0.2)',
          'border-radius': '2px',
          overflow: 'hidden',
          'margin-bottom': '1rem',
        }}
        role="progressbar"
        aria-valuenow={props.progress || 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Loading progress"
      >
        <div
          class="loading-bar"
          style={{
            width: `${props.progress || 0}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #D4A574 0%, #E5C9A8 100%)',
            'border-radius': '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Status message */}
      <div
        style={{
          'font-size': '1.2rem',
          opacity: 0.8,
          'margin-bottom': '1rem',
        }}
      >
        {props.status || 'Loading manifests...'}
      </div>

      {/* Error message */}
      <Show when={props.error}>
        <div
          style={{
            'font-size': '1rem',
            color: '#E07B7B',
            'margin-top': '2rem',
            'max-width': '500px',
            'text-align': 'center',
            padding: '1rem',
            background: 'rgba(224, 123, 123, 0.1)',
            'border-radius': '8px',
            border: '1px solid rgba(224, 123, 123, 0.3)',
          }}
        >
          <div style={{ 'font-weight': 'bold', 'margin-bottom': '0.5rem' }}>⚠ Loading Error</div>
          <div style={{ 'font-size': '0.9rem' }}>{props.error}</div>
        </div>
      </Show>

      {/* Subtitle */}
      <Show when={!props.error}>
        <div
          style={{
            'font-size': '0.9rem',
            opacity: 0.6,
            'margin-top': '2rem',
            'font-style': 'italic',
          }}
        >
          Preparing your journey through Willowmere...
        </div>
      </Show>
    </div>
  );
}
