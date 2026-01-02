import { createSignal, For, onMount } from 'solid-js';
import { gameStore } from '../stores/gameStore';

export default function HUD() {
  const [health, setHealth] = createSignal(5);
  const [warmth, setWarmth] = createSignal(100);
  const [shards, setShards] = createSignal(0);
  const [chapterName, setChapterName] = createSignal("The Calling");
  const [quest, setQuest] = createSignal("Answer the Call");
  
  onMount(() => {
    gameStore.subscribe((state) => {
      setHealth(state.health);
      setWarmth(state.warmth);
      setShards(state.shards);
      setChapterName(state.chapterName);
      setQuest(state.quest);
    });
  });
  
  return (
    <div class="hud">
      <div class="hud-left">
        <div class="health-display">
          <span class="label">Health:</span>
          <div class="health-hearts">
            <For each={Array(5)}>
              {(_, i) => (
                <span class={`heart ${i() < health() ? 'filled' : 'empty'}`}>
                  ♥
                </span>
              )}
            </For>
          </div>
        </div>
        
        <div class="warmth-display">
          <span class="label">Warmth:</span>
          <div class="warmth-bar">
            <div class="warmth-fill" style={{ width: `${warmth()}%` }} />
          </div>
        </div>
        
        <div class="shards-display">
          <span class="label">Shards:</span>
          <span class="count">{shards()}</span>
        </div>
      </div>
      
      <div class="hud-right">
        <div class="chapter-info">
          <p class="chapter-name">{chapterName()}</p>
          <p class="quest">{quest()}</p>
        </div>
      </div>
    </div>
  );
}
