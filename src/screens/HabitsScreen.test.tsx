import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SEED_YLE } from '../lib/seed';
import { HabitsScreen } from './HabitsScreen';

describe('HabitsScreen mobile layout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stacks one full-month card per tracker beneath category labels', () => {
    const { container } = render(
      <HabitsScreen
        data={{ ...SEED_YLE, habits: SEED_YLE.habits.slice(0, 2) }}
        viewMode="me"
        isPartner={false}
        profileInitial="Y"
        onProfile={vi.fn()}
        onTrackDate={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    const categoryLabels = Array.from(container.querySelectorAll('.mobile-habit-category'))
      .map((label) => label.textContent);
    expect(categoryLabels).toEqual(['Skin Care', 'Body Care']);
    expect(container.querySelectorAll('.mobile-habit-card')).toHaveLength(2);
    expect(container.querySelectorAll('.mobile-month-grid')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Add tracker' })).not.toBeInTheDocument();
  });

  it('reopens collapsed calendars upward and expands the final tracker at the bottom', () => {
    let observer: {
      trigger: (element: Element) => void;
    } | null = null;

    class TestIntersectionObserver {
      private callback: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void;

      constructor(callback: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void) {
        this.callback = callback;
        observer = {
          trigger: (element) => this.callback([{ isIntersecting: true, target: element }]),
        };
      }

      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [0];
    }

    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
    const { container } = render(
      <HabitsScreen
        data={{ ...SEED_YLE, habits: SEED_YLE.habits.slice(0, 4) }}
        viewMode="me"
        isPartner={false}
        profileInitial="Y"
        onProfile={vi.fn()}
        onTrackDate={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(container.querySelectorAll('.mobile-habit-card.is-expanded')).toHaveLength(2);
    const thirdTracker = container.querySelector('[data-habit-id="h3"]');
    expect(thirdTracker).not.toBeNull();

    act(() => observer?.trigger(thirdTracker!));

    const cards = Array.from(container.querySelectorAll('.mobile-habit-card'));
    expect(cards[0]).toHaveClass('is-collapsed');
    expect(cards[1]).toHaveClass('is-expanded');
    expect(cards[2]).toHaveClass('is-expanded');
    expect(screen.getByRole('button', { name: 'Expand Double Cleanse calendar' })).toBeInTheDocument();

    const scrollRoot = container.querySelector<HTMLElement>('.track-mobile-screen')!;
    Object.defineProperty(scrollRoot, 'clientHeight', { configurable: true, value: 600 });
    Object.defineProperty(scrollRoot, 'scrollHeight', { configurable: true, value: 2000 });
    const firstCard = container.querySelector<HTMLElement>('[data-habit-card-id="h1"]')!;
    firstCard.getBoundingClientRect = () => ({
      x: 0, y: 100, width: 300, height: 60,
      top: 100, right: 300, bottom: 160, left: 0,
      toJSON: () => ({}),
    });
    scrollRoot.scrollTop = 500;
    act(() => scrollRoot.dispatchEvent(new Event('scroll')));
    scrollRoot.scrollTop = 400;
    act(() => scrollRoot.dispatchEvent(new Event('scroll')));

    expect(firstCard).toHaveClass('is-expanded');
    expect(container.querySelectorAll('.mobile-habit-card.is-expanded')).toHaveLength(2);

    Object.defineProperty(scrollRoot, 'scrollHeight', { configurable: true, value: 1000 });
    scrollRoot.scrollTop = 400;
    act(() => scrollRoot.dispatchEvent(new Event('scroll')));

    const finalCard = container.querySelector<HTMLElement>('[data-habit-card-id="h4"]')!;
    expect(finalCard).toHaveClass('is-expanded');
    expect(container.querySelectorAll('.mobile-habit-card.is-expanded')).toHaveLength(2);
  });
});
