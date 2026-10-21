import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlayerCreate from '../components/PlayerCreate';
import { sendLearn } from '../utils/learnBeacon';

vi.mock('../utils/learnBeacon', () => ({ sendLearn: vi.fn() }));

const defaultProps = {
  lang: 'en',
  onCreatePlayer: vi.fn(),
  onBack: vi.fn(),
};

describe('PlayerCreate', () => {
  it('renders the create player heading', () => {
    render(<PlayerCreate {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Create Player' })).toBeInTheDocument();
  });

  it('renders name input and avatar picker', () => {
    render(<PlayerCreate {...defaultProps} />);
    expect(screen.getByPlaceholderText('Emma')).toBeInTheDocument();
    expect(screen.getByText('Choose Avatar')).toBeInTheDocument();
  });

  it('create button is disabled until name is set', () => {
    render(<PlayerCreate {...defaultProps} />);
    const createBtns = screen.getAllByText('Create Player');
    // The second "Create Player" is the submit button (first is the heading)
    const submitBtn = createBtns[createBtns.length - 1];
    expect(submitBtn).toBeDisabled();

    // Fill name
    fireEvent.change(screen.getByPlaceholderText('Emma'), { target: { value: 'TestKid' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onCreatePlayer with correct args on submit', () => {
    render(<PlayerCreate {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Emma'), { target: { value: 'TestKid' } });
    const createBtns = screen.getAllByText('Create Player');
    fireEvent.click(createBtns[createBtns.length - 1]);
    expect(defaultProps.onCreatePlayer).toHaveBeenCalledWith('TestKid', '🦊', true);
  });
  it('first player can start without a name (play-first) and gets a default name', () => {
    const onCreatePlayer = vi.fn();
    render(<PlayerCreate {...defaultProps} onCreatePlayer={onCreatePlayer} first />);
    const btn = screen.getByRole('button', { name: 'Start playing' });
    expect(btn).not.toBeDisabled();
    expect(screen.getByText('No name needed — you can add one later')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onCreatePlayer).toHaveBeenCalledWith('Player 1', '🦊', true, true);
  });

  it('first player who types a name is created with it', () => {
    const onCreatePlayer = vi.fn();
    render(<PlayerCreate {...defaultProps} onCreatePlayer={onCreatePlayer} first />);
    fireEvent.change(screen.getByPlaceholderText('Emma'), { target: { value: 'Dana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start playing' }));
    expect(onCreatePlayer).toHaveBeenCalledWith('Dana', '🦊', true);
  });

  it('counts the first-player screen (onb create_view), not later players', () => {
    sendLearn.mockClear();
    render(<PlayerCreate {...defaultProps} first />);
    expect(sendLearn).toHaveBeenCalledWith('onb', 'create_view');
    sendLearn.mockClear();
    render(<PlayerCreate {...defaultProps} />);
    expect(sendLearn).not.toHaveBeenCalled();
  });
});
