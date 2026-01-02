/** @jsxImportSource solid-js */
/**
 * Menu Component
 *
 * Main menu overlay with warm Redwall-inspired styling.
 *
 * @module ui/Menu
 */

import { Show } from 'solid-js';

/**
 * Menu Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether menu is visible
 * @param {Function} props.onStartGame - Callback when "Begin Journey" clicked
 * @param {Function} props.onContinue - Callback when "Continue" clicked (if save exists)
 * @param {boolean} props.hasSaveData - Whether save data exists
 */
export default function Menu(props) {
  return (
    <Show when={props.visible}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(180deg, #1a1a24 0%, #2C3E50 100%)',
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'justify-content': 'center',
          'z-index': 2000,
          animation: 'fadeIn 0.5s ease-in-out',
        }}
      >
        {/* Title */}
        <div
          style={{
            'text-align': 'center',
            'margin-bottom': '60px',
            animation: 'slideDown 0.8s ease-out',
          }}
        >
          <h1
            style={{
              'font-size': '64px',
              'font-family': 'serif',
              color: '#ECF0F1',
              margin: 0,
              'text-shadow': '0 4px 20px rgba(231, 126, 34, 0.6)',
              'letter-spacing': '4px',
            }}
          >
            OTTERBLADE
          </h1>
          <h2
            style={{
              'font-size': '32px',
              'font-family': 'serif',
              color: '#E67E22',
              margin: '10px 0 0 0',
              'font-style': 'italic',
              'letter-spacing': '2px',
            }}
          >
            Odyssey
          </h2>
          <div
            style={{
              'font-size': '14px',
              'font-family': 'serif',
              color: '#95A5A6',
              'margin-top': '20px',
              'letter-spacing': '3px',
            }}
          >
            A Redwall-Inspired Adventure
          </div>
        </div>

        {/* Decorative divider */}
        <div
          style={{
            width: '300px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #E67E22, transparent)',
            'margin-bottom': '40px',
          }}
        />

        {/* Menu buttons */}
        <div
          style={{
            display: 'flex',
            'flex-direction': 'column',
            gap: '20px',
            'align-items': 'center',
            animation: 'slideUp 0.8s ease-out',
          }}
        >
          <Show when={props.hasSaveData}>
            <button
              type="button"
              onClick={props.onContinue}
              style={{
                padding: '15px 60px',
                'font-size': '20px',
                'font-family': 'serif',
                'font-weight': 'bold',
                color: '#ECF0F1',
                background: 'linear-gradient(135deg, #27AE60 0%, #229954 100%)',
                border: '3px solid #1E8449',
                'border-radius': '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                'text-shadow': '0 2px 4px rgba(0,0,0,0.3)',
                'box-shadow': '0 4px 15px rgba(39, 174, 96, 0.4)',
                'letter-spacing': '1px',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 6px 20px rgba(39, 174, 96, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(39, 174, 96, 0.4)';
              }}
            >
              Continue Journey
            </button>
          </Show>

          <button
            type="button"
            onClick={props.onStartGame}
            style={{
              padding: '15px 60px',
              'font-size': '20px',
              'font-family': 'serif',
              'font-weight': 'bold',
              color: '#ECF0F1',
              background: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
              border: '3px solid #CA6F1E',
              'border-radius': '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              'text-shadow': '0 2px 4px rgba(0,0,0,0.3)',
              'box-shadow': '0 4px 15px rgba(230, 126, 34, 0.4)',
              'letter-spacing': '1px',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px) scale(1.05)';
              e.target.style.boxShadow = '0 6px 20px rgba(230, 126, 34, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(230, 126, 34, 0.4)';
            }}
          >
            {props.hasSaveData ? 'New Journey' : 'Begin Journey'}
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            'text-align': 'center',
            color: '#7F8C8D',
            'font-size': '12px',
            'font-family': 'monospace',
          }}
        >
          <div style={{ 'margin-bottom': '10px' }}>
            WASD/Arrows to Move • Space to Jump • Z to Attack • E to Interact
          </div>
          <div style={{ opacity: 0.6 }}>
            A wordless, procedural adventure in the spirit of Redwall
          </div>
        </div>

        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            width: '80px',
            height: '80px',
            'border-radius': '50%',
            background: 'radial-gradient(circle, rgba(230, 126, 34, 0.2), transparent)',
            animation: 'float 6s ease-in-out infinite',
            'pointer-events': 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '15%',
            width: '60px',
            height: '60px',
            'border-radius': '50%',
            background: 'radial-gradient(circle, rgba(244, 208, 63, 0.2), transparent)',
            animation: 'float 8s ease-in-out infinite 1s',
            'pointer-events': 'none',
          }}
        />

        {/* CSS animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideDown {
            from { 
              opacity: 0;
              transform: translateY(-50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    </Show>
  );
}
