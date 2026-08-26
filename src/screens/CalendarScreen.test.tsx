import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SEED_LUIS } from '../lib/seed';
import { CalendarScreen } from './CalendarScreen';

describe('CalendarScreen mobile task list', () => {
  it('allows touch scrolling on draggable task rows before long-press activation', () => {
    const { container } = render(
      <CalendarScreen
        data={SEED_LUIS}
        viewMode="me"
        isPartner={false}
        profileInitial="L"
        onProfile={vi.fn()}
        onCheck={vi.fn()}
        onEdit={vi.fn()}
        onReorderTasks={vi.fn()}
        onMoveTask={vi.fn()}
      />,
    );

    const taskRows = container.querySelectorAll<HTMLElement>('.task-item');
    expect(taskRows.length).toBeGreaterThan(0);
    taskRows.forEach((row) => expect(row.style.touchAction).toBe('auto'));
  });

  it('renders droppable calendar day cells in month view', () => {
    const { container } = render(
      <CalendarScreen
        data={SEED_LUIS}
        viewMode="me"
        isPartner={false}
        profileInitial="L"
        defaultView="month"
        onProfile={vi.fn()}
        onCheck={vi.fn()}
        onEdit={vi.fn()}
        onReorderTasks={vi.fn()}
        onMoveTask={vi.fn()}
      />,
    );

    const calDays = container.querySelectorAll<HTMLElement>('.cal-day');
    expect(calDays.length).toBeGreaterThanOrEqual(28);
  });
});
