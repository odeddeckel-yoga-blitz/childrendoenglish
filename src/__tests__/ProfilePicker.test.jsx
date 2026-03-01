import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProfilePicker from '../components/ProfilePicker';

const players = [
  { id: '1', name: 'Alex', avatar: '🦊', canRead: true },
  { id: '2', name: 'Sam', avatar: '🐱', canRead: false },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  players,
  activePlayerId: '1',
  lang: 'en',
  onSwitch: vi.fn(),
  onAdd: vi.fn(),
  onDelete: vi.fn(),
};

describe('ProfilePicker', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ProfilePicker {...defaultProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders player names when open', () => {
    render(<ProfilePicker {...defaultProps} />);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('shows the who is playing header', () => {
    render(<ProfilePicker {...defaultProps} />);
    expect(screen.getByText("Who's playing?")).toBeInTheDocument();
  });

  it('calls onSwitch when clicking a different player', () => {
    render(<ProfilePicker {...defaultProps} />);
    fireEvent.click(screen.getByText('Sam'));
    expect(defaultProps.onSwitch).toHaveBeenCalledWith('2');
  });

  it('calls onClose when clicking backdrop', () => {
    const { container } = render(<ProfilePicker {...defaultProps} />);
    // Click the backdrop (first child div with bg-black/40)
    const backdrop = container.querySelector('.bg-black\\/40');
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows add player button', () => {
    render(<ProfilePicker {...defaultProps} />);
    expect(screen.getByText('Add Player')).toBeInTheDocument();
  });

  it('shows delete buttons when 2+ players', () => {
    render(<ProfilePicker {...defaultProps} />);
    const deleteButtons = screen.getAllByLabelText('Delete Player');
    expect(deleteButtons.length).toBe(2);
  });
});
