import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SEED_YLE, TODAY } from '../../lib/seed';
import { WebHabitsScreen } from './WebHabitsScreen';

const monthLabel = (offset: number) =>
  new Date(TODAY.getFullYear(), TODAY.getMonth() + offset, 1).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });

describe('WebHabitsScreen calendar navigation', () => {
  it('moves each habit calendar independently', () => {
    render(
      <WebHabitsScreen
        data={{ ...SEED_YLE, habits: SEED_YLE.habits.slice(0, 2) }}
        isPartner={false}
        onEdit={vi.fn()}
        onTrackDate={vi.fn()}
      />,
    );

    const firstCard = screen.getByText('Double Cleanse').closest('.habit-card');
    const secondCard = screen.getByText('Bath').closest('.habit-card');

    expect(firstCard).toHaveTextContent(monthLabel(0));
    expect(secondCard).toHaveTextContent(monthLabel(0));
    expect(firstCard).not.toHaveTextContent('AM + PM');
    expect(firstCard?.querySelector('.hc-head .hc-calendar-nav')).toBeInTheDocument();
    expect(firstCard?.querySelector('.hc-calendar-nav')).toBeInTheDocument();
    expect(firstCard?.querySelector('.habit-foot')).not.toBeInTheDocument();
    expect(secondCard?.querySelector('.habit-foot')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next month for Double Cleanse' }));

    expect(firstCard).toHaveTextContent(monthLabel(1));
    expect(secondCard).toHaveTextContent(monthLabel(0));
  });

  it('jumps one habit card to a selected month and year', () => {
    render(
      <WebHabitsScreen
        data={{ ...SEED_YLE, habits: SEED_YLE.habits.slice(0, 2) }}
        isPartner={false}
        onEdit={vi.fn()}
        onTrackDate={vi.fn()}
      />,
    );
    const targetYear = TODAY.getFullYear() + 1;
    const firstCard = screen.getByText('Double Cleanse').closest('.habit-card');
    const secondCard = screen.getByText('Bath').closest('.habit-card');

    fireEvent.click(screen.getByRole('button', {
      name: `Choose month and year for Double Cleanse, currently ${monthLabel(0)}`,
    }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Month for Double Cleanse' }), {
      target: { value: 0 },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Year for Double Cleanse' }), {
      target: { value: targetYear },
    });

    expect(firstCard).toHaveTextContent(`Jan ${targetYear}`);
    expect(secondCard).toHaveTextContent(monthLabel(0));
  });
});
