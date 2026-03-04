import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlayerSelect from '../components/PlayerSelect';

const defaultProps = {
  players: [
    { id: '1', name: 'Alex', avatar: '🦊' },
    { id: '2', name: 'Sam', avatar: '🐱' },
  ],
  activePlayerId: '1',
  lang: 'en',
  onSelectPlayer: vi.fn(),
  onManage: vi.fn(),
  onAddPlayer: vi.fn(),
};

describe('PlayerSelect', () => {
  it('renders the who is playing heading', () => {
    render(<PlayerSelect {...defaultProps} />);
    expect(screen.getByText("Who's playing?")).toBeInTheDocument();
  });

  it('renders all player buttons with names', () => {
    render(<PlayerSelect {...defaultProps} />);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('calls onSelectPlayer when a player is clicked', () => {
    render(<PlayerSelect {...defaultProps} />);
    fireEvent.click(screen.getByText('Sam'));
    expect(defaultProps.onSelectPlayer).toHaveBeenCalledWith('2');
  });

  it('renders add player and manage buttons', () => {
    render(<PlayerSelect {...defaultProps} />);
    expect(screen.getByText('Add Player')).toBeInTheDocument();
    expect(screen.getByText('Manage Players')).toBeInTheDocument();
  });
});
