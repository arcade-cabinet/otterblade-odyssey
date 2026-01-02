/**
 * @fileoverview React Component Tests for Game UI
 * Tests React components using React Testing Library
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'wouter';

// Mock the store
vi.mock('@/game/store', () => ({
  useStore: vi.fn(() => ({
    health: 5,
    maxHealth: 5,
    shards: 0,
    gameStarted: false,
    currentChapter: 0,
    startGame: vi.fn(),
    takeDamage: vi.fn(),
    collectShard: vi.fn(),
  })),
}));

// Create a wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
};

describe('HUD Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render health hearts correctly', async () => {
    const { useStore } = await import('@/game/store');
    vi.mocked(useStore).mockReturnValue({
      health: 3,
      maxHealth: 5,
      shards: 0,
      gameStarted: true,
    } as any);

    const { default: HUD } = await import('@/components/hud/HUD');
    render(<HUD />, { wrapper: createWrapper() });

    // Should show hearts
    const hearts = screen.getAllByRole('img', { hidden: true });
    expect(hearts.length).toBeGreaterThan(0);
  });

  it('should render shard count', async () => {
    const { useStore } = await import('@/game/store');
    vi.mocked(useStore).mockReturnValue({
      health: 5,
      maxHealth: 5,
      shards: 10,
      gameStarted: true,
    } as any);

    const { default: HUD } = await import('@/components/hud/HUD');
    render(<HUD />, { wrapper: createWrapper() });

    // Should show shard count
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});

describe('Start Menu', () => {
  it('should render start button', async () => {
    const { useStore } = await import('@/game/store');
    vi.mocked(useStore).mockReturnValue({
      health: 5,
      maxHealth: 5,
      shards: 0,
      gameStarted: false,
      startGame: vi.fn(),
    } as any);

    const { default: StartMenu } = await import('@/components/ui/StartMenu');
    render(<StartMenu />, { wrapper: createWrapper() });

    // Should show game title
    expect(screen.getByText(/Otterblade Odyssey/i)).toBeInTheDocument();
    
    // Should show start button
    const startButton = screen.getByRole('button', { name: /begin.*odyssey/i });
    expect(startButton).toBeInTheDocument();
  });

  it('should call startGame when button clicked', async () => {
    const startGameMock = vi.fn();
    const { useStore } = await import('@/game/store');
    vi.mocked(useStore).mockReturnValue({
      health: 5,
      maxHealth: 5,
      shards: 0,
      gameStarted: false,
      startGame: startGameMock,
    } as any);

    const { default: StartMenu } = await import('@/components/ui/StartMenu');
    render(<StartMenu />, { wrapper: createWrapper() });

    const startButton = screen.getByRole('button', { name: /begin.*odyssey/i });
    await userEvent.click(startButton);

    expect(startGameMock).toHaveBeenCalled();
  });
});

describe('Chapter Plate', () => {
  it('should render chapter information', async () => {
    const { default: ChapterPlate } = await import('@/components/ui/ChapterPlate');
    
    render(
      <ChapterPlate
        chapterNumber={0}
        title="The Calling"
        quest="Answer the Call"
        location="Finn's Cottage"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('THE CALLING')).toBeInTheDocument();
    expect(screen.getByText('Answer the Call')).toBeInTheDocument();
    expect(screen.getByText("Finn's Cottage")).toBeInTheDocument();
  });

  it('should show chapter image', async () => {
    const { default: ChapterPlate } = await import('@/components/ui/ChapterPlate');
    
    render(
      <ChapterPlate
        chapterNumber={0}
        title="The Calling"
        quest="Answer the Call"
        location="Finn's Cottage"
      />,
      { wrapper: createWrapper() }
    );

    const image = screen.getByAltText('THE CALLING');
    expect(image).toBeInTheDocument();
  });
});

describe('Game Over Screen', () => {
  it('should render when health is 0', async () => {
    const { useStore } = await import('@/game/store');
    vi.mocked(useStore).mockReturnValue({
      health: 0,
      maxHealth: 5,
      shards: 0,
      gameStarted: true,
      restartGame: vi.fn(),
    } as any);

    const { default: GameOver } = await import('@/components/ui/GameOver');
    render(<GameOver />, { wrapper: createWrapper() });

    expect(screen.getByText(/game over/i)).toBeInTheDocument();
  });

  it('should show restart button', async () => {
    const restartMock = vi.fn();
    const { useStore } = await import('@/game/store');
    vi.mocked(useStore).mockReturnValue({
      health: 0,
      maxHealth: 5,
      shards: 0,
      gameStarted: true,
      restartGame: restartMock,
    } as any);

    const { default: GameOver } = await import('@/components/ui/GameOver');
    render(<GameOver />, { wrapper: createWrapper() });

    const restartButton = screen.getByRole('button', { name: /restart/i });
    await userEvent.click(restartButton);

    expect(restartMock).toHaveBeenCalled();
  });
});

describe('Victory Screen', () => {
  it('should render when game is won', async () => {
    const { useStore } = await import('@/game/store');
    vi.mocked(useStore).mockReturnValue({
      health: 5,
      maxHealth: 5,
      shards: 100,
      gameStarted: true,
      gameWon: true,
      currentChapter: 9,
    } as any);

    const { default: Victory } = await import('@/components/ui/Victory');
    render(<Victory />, { wrapper: createWrapper() });

    expect(screen.getByText(/victory/i)).toBeInTheDocument();
  });
});
