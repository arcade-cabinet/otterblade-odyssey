/**
 * TouchControls.jsx
 * Mobile touch controls using nipplejs
 * Implements touch controls per CLAUDE.md line 64
 */

import { onCleanup, onMount, Show } from 'solid-js';
import { inputManager } from '../systems/InputManager';

export default function TouchControls(_props) {
  let joystickZone;
  let joystickManager;

  const isMobile = () => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  };

  onMount(() => {
    if (!isMobile()) return;

    // Create virtual joystick (dynamic import to avoid SSR window access)
    import('nipplejs')
      .then(({ default: nipplejs }) => {
        joystickManager = nipplejs.create({
          zone: joystickZone,
          mode: 'static',
          position: { left: '15%', bottom: '20%' },
          color: '#E67E22', // Hearth orange from WORLD.md
          size: 120,
          threshold: 0.1,
          fadeTime: 0,
        });

        // Joystick event handlers
        joystickManager.on('move', (_evt, data) => {
          if (data.vector) {
            inputManager.setTouchJoystick(data.vector.x, data.vector.y);
          }
        });

        joystickManager.on('end', () => {
          inputManager.setTouchJoystick(0, 0);
        });
      })
      .catch(() => {});
  });

  onCleanup(() => {
    if (joystickManager) {
      joystickManager.destroy();
    }
  });

  const handleJump = () => {
    inputManager.setTouchButton('jump', true);
    setTimeout(() => inputManager.setTouchButton('jump', false), 100);
  };

  const handleAttack = () => {
    inputManager.setTouchButton('attack', true);
    setTimeout(() => inputManager.setTouchButton('attack', false), 100);
  };

  const handleInteract = () => {
    inputManager.setTouchButton('interact', true);
    setTimeout(() => inputManager.setTouchButton('interact', false), 100);
  };

  return (
    <Show when={isMobile()}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          'pointer-events': 'none',
          'z-index': 1000,
        }}
      >
        {/* Joystick container */}
        <div
          ref={joystickZone}
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '200px',
            height: '200px',
            'pointer-events': 'auto',
          }}
        />

        {/* Action buttons (right side) */}
        <div
          style={{
            position: 'absolute',
            right: '5%',
            bottom: '15%',
            display: 'flex',
            'flex-direction': 'column',
            gap: '15px',
            'pointer-events': 'auto',
          }}
        >
          {/* Jump button (top) */}
          <button
            type="button"
            onTouchStart={handleJump}
            style={{
              width: '70px',
              height: '70px',
              'border-radius': '50%',
              border: '3px solid #F4D03F',
              background: 'rgba(230, 126, 34, 0.7)',
              color: 'white',
              'font-size': '20px',
              'font-weight': 'bold',
              cursor: 'pointer',
              'box-shadow': '0 4px 8px rgba(0,0,0,0.3)',
              'user-select': 'none',
              '-webkit-tap-highlight-color': 'transparent',
            }}
          >
            ↑
          </button>

          {/* Attack button (middle) */}
          <button
            type="button"
            onTouchStart={handleAttack}
            style={{
              width: '70px',
              height: '70px',
              'border-radius': '50%',
              border: '3px solid #C0392B',
              background: 'rgba(192, 57, 43, 0.7)',
              color: 'white',
              'font-size': '20px',
              'font-weight': 'bold',
              cursor: 'pointer',
              'box-shadow': '0 4px 8px rgba(0,0,0,0.3)',
              'user-select': 'none',
              '-webkit-tap-highlight-color': 'transparent',
            }}
          >
            ⚔️
          </button>

          {/* Interact button (bottom) */}
          <button
            type="button"
            onTouchStart={handleInteract}
            style={{
              width: '70px',
              height: '70px',
              'border-radius': '50%',
              border: '3px solid #8FBC8F',
              background: 'rgba(143, 188, 143, 0.7)',
              color: 'white',
              'font-size': '20px',
              'font-weight': 'bold',
              cursor: 'pointer',
              'box-shadow': '0 4px 8px rgba(0,0,0,0.3)',
              'user-select': 'none',
              '-webkit-tap-highlight-color': 'transparent',
            }}
          >
            E
          </button>
        </div>

        {/* Desktop hint (hidden on mobile) */}
        <Show when={!isMobile()}>
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              padding: '10px 15px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#F4D03F',
              'border-radius': '8px',
              'font-size': '14px',
              'font-family': 'monospace',
            }}
          >
            <div>WASD / Arrows: Move</div>
            <div>Space / W: Jump</div>
            <div>E: Interact</div>
            <div>J / Z: Attack</div>
          </div>
        </Show>
      </div>
    </Show>
  );
}
