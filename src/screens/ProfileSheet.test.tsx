import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileSheet } from './ProfileSheet';
import {
  DEFAULT_NAV_ORDER,
  DEFAULT_VISIBLE_TABS,
} from '../lib/navigation';

const renderProfile = (overrides: Partial<ComponentProps<typeof ProfileSheet>> = {}) => render(
  <ProfileSheet
    onClose={vi.fn()}
    viewMode="me"
    onSwitchView={vi.fn()}
    visibleTabs={DEFAULT_VISIBLE_TABS}
    onVisibleTabToggle={vi.fn()}
    navOrder={DEFAULT_NAV_ORDER}
    onSaveNavigationPreferences={vi.fn()}
    partnerLinked={false}
    partnerName="Kyle"
    {...overrides}
  />,
);

describe('ProfileSheet navigation customization', () => {
  it('shows customization for an own account without a linked partner', () => {
    renderProfile();

    expect(screen.getByText('Customize navigation')).toBeInTheDocument();
  });

  it('shows customization for an own account with a linked partner', () => {
    renderProfile({ partnerLinked: true });

    expect(screen.getByText('Customize navigation')).toBeInTheDocument();
  });

  it('keeps customization hidden while viewing a partner account', () => {
    renderProfile({ partnerLinked: true, viewMode: 'partner' });

    expect(screen.queryByText('Customize navigation')).not.toBeInTheDocument();
  });
});
