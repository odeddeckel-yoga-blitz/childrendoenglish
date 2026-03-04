import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlayerCreate from '../components/PlayerCreate';

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

  it('renders can-read selection buttons', () => {
    render(<PlayerCreate {...defaultProps} />);
    expect(screen.getByText('I can read!')).toBeInTheDocument();
    expect(screen.getByText('Not yet')).toBeInTheDocument();
  });

  it('create button is disabled until name and reading ability are set', () => {
    render(<PlayerCreate {...defaultProps} />);
    const createBtns = screen.getAllByText('Create Player');
    // The second "Create Player" is the submit button (first is the heading)
    const submitBtn = createBtns[createBtns.length - 1];
    expect(submitBtn).toBeDisabled();

    // Fill name
    fireEvent.change(screen.getByPlaceholderText('Emma'), { target: { value: 'TestKid' } });
    expect(submitBtn).toBeDisabled();

    // Pick reading ability
    fireEvent.click(screen.getByText('I can read!'));
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onCreatePlayer with correct args on submit', () => {
    render(<PlayerCreate {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Emma'), { target: { value: 'TestKid' } });
    fireEvent.click(screen.getByText('Not yet'));
    const createBtns = screen.getAllByText('Create Player');
    fireEvent.click(createBtns[createBtns.length - 1]);
    expect(defaultProps.onCreatePlayer).toHaveBeenCalledWith('TestKid', '🦊', false);
  });
});
