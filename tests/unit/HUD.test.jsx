/** @jsxImportSource solid-js */
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import HUD from '../../game/src/game/ui/HUD';

describe('HUD Component', () => {
  let container;
  let dispose;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (dispose) dispose();
    document.body.removeChild(container);
    container = null;
  });

  it('renders health hearts correctly', () => {
    dispose = render(
      () => (
        <HUD
          health={3}
          maxHealth={5}
          warmth={100}
          maxWarmth={100}
          shards={0}
          chapterName="Test Chapter"
          questObjectives={[]}
        />
      ),
      container
    );

    // Verify hearts
    // HUD logic: <span>{filled ? '❤️' : ...}</span>?
    // Actually, HUD.jsx lines 69-82 loop over hearts and output spans.
    // We check for spans containing the heart emoji.
    const hearts = Array.from(container.querySelectorAll('span')).filter((s) =>
      s.textContent.includes('❤️')
    );

    expect(hearts.length).toBe(5);

    // Check that 3 are red (filled) and 2 are grey/dim (empty)
    // Filled color: #E74C3C
    // Empty color: #555
    const filledHearts = hearts.filter(
      (s) => s.style.color === 'rgb(231, 76, 60)' || s.style.color === '#E74C3C'
    ); // rgb(231, 76, 60) is #E74C3C
    const emptyHearts = hearts.filter(
      (s) => s.style.color === 'rgb(85, 85, 85)' || s.style.color === '#555'
    );

    // Note: style.color might return RGB string in DOM.
    // rgb(231, 76, 60)
    // rgb(85, 85, 85)

    // We expect 3 filled (health=3)
    expect(filledHearts.length).toBe(3);
    expect(emptyHearts.length).toBe(2);
  });

  it('renders warmth bar correctly', () => {
    dispose = render(
      () => (
        <HUD
          health={5}
          maxHealth={5}
          warmth={50}
          maxWarmth={100}
          shards={10}
          chapterName="Test Chapter"
          questObjectives={[]}
        />
      ),
      container
    );

    // Check warmth text "50%"
    // Line 106: <span>{Math.round(warmthPercent())}%</span>
    const spans = Array.from(container.querySelectorAll('span'));
    const percentSpan = spans.find((s) => s.textContent.includes('50%'));
    expect(percentSpan).toBeDefined();

    // Check shard count
    const shardSpan = spans.find((s) => s.textContent.includes('10'));
    // Shard count is usually next to ✨
    // Line 163: {props.shards}
    // It's in a span.
    expect(shardSpan).toBeDefined();
  });
});
