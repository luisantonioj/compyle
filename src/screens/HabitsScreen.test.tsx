import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SEED_YLE } from '../lib/seed';
import { HabitsScreen } from './HabitsScreen';

describe('HabitsScreen mobile layout', () => {
  it('stacks one full-month card per tracker beneath category labels', () => {
    const onReorderHabits = vi.fn();
    const { container } = render(
      <HabitsScreen
        data={{ ...SEED_YLE, habits: SEED_YLE.habits.slice(0, 2) }}
        viewMode="me"
        isPartner={false}
        profileInitial="Y"
        onProfile={vi.fn()}
        onTrackDate={vi.fn()}
        onEdit={vi.fn()}
        onReorderHabits={onReorderHabits}
      />,
    );

    const categoryLabels = Array.from(container.querySelectorAll('.mobile-habit-category'))
      .map((label) => label.textContent);
    expect(categoryLabels).toEqual(['Skin Care', 'Body Care']);
    expect(container.querySelectorAll('.mobile-habit-card')).toHaveLength(2);
    expect(container.querySelectorAll('.mobile-month-grid')).toHaveLength(2);
    container.querySelectorAll<HTMLElement>('.mobile-habit-card')
      .forEach((card) => expect(card.style.touchAction).toBe('auto'));
    expect(screen.queryByRole('button', { name: 'Add tracker' })).not.toBeInTheDocument();
  });

  it('keeps all trackers expanded without automatic untoggling or collapsing', () => {
    const onTrackDate = vi.fn();
    const onEdit = vi.fn();
    const habits = SEED_YLE.habits.slice(0, 4);

    const { container } = render(
      <HabitsScreen
        data={{ ...SEED_YLE, habits }}
        viewMode="me"
        isPartner={false}
        profileInitial="Y"
        onProfile={vi.fn()}
        onTrackDate={onTrackDate}
        onEdit={onEdit}
      />,
    );

    // All 4 trackers should be rendered and expanded
    const cards = Array.from(container.querySelectorAll('.mobile-habit-card'));
    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      expect(card).toHaveClass('is-expanded');
      expect(card).not.toHaveClass('is-collapsed');
    });

    // All 4 month grids should be present and visible
    expect(container.querySelectorAll('.mobile-month-grid')).toHaveLength(4);

    // No collapsed summary buttons should be displayed
    expect(container.querySelectorAll('.mobile-habit-summary')).toHaveLength(0);

    // Clicking a tracker title opens the edit flow
    const firstTitle = screen.getByRole('button', { name: habits[0].name });
    fireEvent.click(firstTitle);
    expect(onEdit).toHaveBeenCalledWith({ type: 'habit', item: habits[0] });
  });
});
