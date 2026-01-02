/** @jsxImportSource solid-js */
/**
 * HUD Component
 * 
 * Heads-up display showing health, warmth, shards, and current quest.
 * 
 * @module ui/HUD
 */

import { For, Show } from 'solid-js';

/**
 * HUD Component
 * 
 * @param {Object} props - Component props
 * @param {number} props.health - Current health
 * @param {number} props.maxHealth - Maximum health
 * @param {number} props.warmth - Current warmth (0-100)
 * @param {number} props.maxWarmth - Maximum warmth
 * @param {number} props.shards - Collected shards
 * @param {string} props.chapterName - Current chapter name
 * @param {Array} props.questObjectives - Active quest objectives
 * @param {boolean} props.showQuestTracker - Whether to show quest tracker
 */
export default function HUD(props) {
  const hearts = () => {
    const arr = [];
    for (let i = 0; i < props.maxHealth; i++) {
      arr.push(i < props.health);
    }
    return arr;
  };

  const warmthPercent = () => (props.warmth / props.maxWarmth) * 100;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      padding: '20px',
      'pointer-events': 'none',
      'z-index': 1000
    }}>
      {/* Top left - Health and Warmth */}
      <div style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '10px',
        'align-items': 'flex-start'
      }}>
        {/* Health Hearts */}
        <div style={{
          display: 'flex',
          gap: '5px',
          'align-items': 'center',
          background: 'rgba(26, 26, 36, 0.8)',
          padding: '10px 15px',
          'border-radius': '10px',
          border: '2px solid rgba(231, 126, 34, 0.5)'
        }}>
          <For each={hearts()}>
            {(filled) => (
              <span style={{
                'font-size': '24px',
                color: filled ? '#E74C3C' : '#555',
                'text-shadow': filled ? '0 0 10px rgba(231, 76, 60, 0.8)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                ❤️
              </span>
            )}
          </For>
        </div>

        {/* Warmth Bar */}
        <div style={{
          background: 'rgba(26, 26, 36, 0.8)',
          padding: '10px 15px',
          'border-radius': '10px',
          border: '2px solid rgba(231, 126, 34, 0.5)',
          'min-width': '200px'
        }}>
          <div style={{
            display: 'flex',
            'justify-content': 'space-between',
            'margin-bottom': '5px',
            'font-size': '12px',
            color: '#F4D03F',
            'font-family': 'monospace'
          }}>
            <span>🔥 Warmth</span>
            <span>{Math.round(warmthPercent())}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(0, 0, 0, 0.5)',
            'border-radius': '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${warmthPercent()}%`,
              height: '100%',
              background: warmthPercent() > 50 
                ? 'linear-gradient(90deg, #E67E22 0%, #F39C12 100%)'
                : warmthPercent() > 25
                  ? 'linear-gradient(90deg, #F39C12 0%, #F4D03F 100%)'
                  : 'linear-gradient(90deg, #7F8C8D 0%, #95A5A6 100%)',
              transition: 'width 0.3s ease, background 0.3s ease',
              'box-shadow': warmthPercent() > 25 ? '0 0 10px rgba(243, 156, 18, 0.6)' : 'none'
            }} />
          </div>
        </div>

        {/* Shards */}
        <div style={{
          display: 'flex',
          'align-items': 'center',
          gap: '10px',
          background: 'rgba(26, 26, 36, 0.8)',
          padding: '10px 15px',
          'border-radius': '10px',
          border: '2px solid rgba(231, 126, 34, 0.5)'
        }}>
          <span style={{
            'font-size': '20px',
            color: '#F4D03F',
            'text-shadow': '0 0 10px rgba(244, 208, 63, 0.8)'
          }}>
            ✨
          </span>
          <span style={{
            'font-size': '18px',
            color: '#F4D03F',
            'font-family': 'monospace',
            'font-weight': 'bold'
          }}>
            {props.shards}
          </span>
        </div>
      </div>

      {/* Top right - Chapter name */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(26, 26, 36, 0.8)',
        padding: '10px 20px',
        'border-radius': '10px',
        border: '2px solid rgba(231, 126, 34, 0.5)',
        'text-align': 'right'
      }}>
        <div style={{
          'font-size': '12px',
          color: '#95A5A6',
          'margin-bottom': '2px',
          'font-family': 'monospace'
        }}>
          Chapter
        </div>
        <div style={{
          'font-size': '16px',
          color: '#ECF0F1',
          'font-weight': 'bold',
          'font-family': 'serif'
        }}>
          {props.chapterName}
        </div>
      </div>

      {/* Quest Tracker (bottom left) */}
      <Show when={props.showQuestTracker && props.questObjectives && props.questObjectives.length > 0}>
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(26, 26, 36, 0.9)',
          padding: '15px 20px',
          'border-radius': '10px',
          border: '2px solid rgba(231, 126, 34, 0.5)',
          'max-width': '300px'
        }}>
          <div style={{
            'font-size': '14px',
            color: '#F4D03F',
            'margin-bottom': '10px',
            'font-weight': 'bold',
            'font-family': 'serif'
          }}>
            📜 Quest Objectives
          </div>
          <For each={props.questObjectives}>
            {(objective) => (
              <div style={{
                'font-size': '12px',
                color: objective.completed ? '#2ECC71' : '#ECF0F1',
                'margin-bottom': '5px',
                'font-family': 'monospace',
                display: 'flex',
                'align-items': 'center',
                gap: '8px'
              }}>
                <span>{objective.completed ? '✓' : '○'}</span>
                <span style={{
                  'text-decoration': objective.completed ? 'line-through' : 'none',
                  opacity: objective.completed ? 0.6 : 1
                }}>
                  {objective.description}
                </span>
                <Show when={!objective.completed && objective.required > 1}>
                  <span style={{
                    'font-size': '10px',
                    color: '#7F8C8D',
                    'margin-left': 'auto'
                  }}>
                    {objective.current}/{objective.required}
                  </span>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Interaction prompt (center bottom) */}
      <Show when={props.interactionPrompt}>
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(26, 26, 36, 0.95)',
          padding: '12px 24px',
          'border-radius': '20px',
          border: '2px solid rgba(244, 208, 63, 0.8)',
          'text-align': 'center',
          'box-shadow': '0 4px 20px rgba(244, 208, 63, 0.3)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <span style={{
            'font-size': '14px',
            color: '#ECF0F1',
            'font-family': 'monospace',
            'margin-right': '8px'
          }}>
            Press
          </span>
          <span style={{
            'font-size': '16px',
            color: '#F4D03F',
            'font-weight': 'bold',
            'font-family': 'monospace',
            padding: '2px 8px',
            background: 'rgba(244, 208, 63, 0.2)',
            'border-radius': '4px',
            margin: '0 4px'
          }}>
            E
          </span>
          <span style={{
            'font-size': '14px',
            color: '#ECF0F1',
            'font-family': 'monospace',
            'margin-left': '8px'
          }}>
            to {props.interactionPrompt}
          </span>
        </div>
      </Show>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.8; transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
