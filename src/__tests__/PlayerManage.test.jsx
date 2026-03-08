import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerManage from '../components/PlayerManage';
import * as storage from '../utils/storage';

vi.mock('../utils/i18n', () => ({ t: (key) => key, isRTL: () => false }));
vi.mock('../utils/storage', () => ({
  exportAllData: vi.fn(),
  importAllData: vi.fn(),
  loadPlayerRegistry: vi.fn(),
}));
vi.mock('../hooks/useFocusTrap', () => ({ default: vi.fn() }));

const players = [
  { id: '1', name: 'Alice', avatar: '🦊', canRead: true },
  { id: '2', name: 'Bob', avatar: '🐱', canRead: false },
];

const defaultProps = {
  players,
  lang: 'en',
  onUpdatePlayer: vi.fn(),
  onResetPlayer: vi.fn(),
  onDeletePlayer: vi.fn(),
  onAddPlayer: vi.fn(),
  onBack: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PlayerManage', () => {
  // 1. Renders all players with names and avatars
  it('renders all players with names and avatars', () => {
    render(<PlayerManage {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('🦊')).toBeInTheDocument();
    expect(screen.getByText('🐱')).toBeInTheDocument();
  });

  // 2. Back button calls onBack
  it('calls onBack when the back button is clicked', () => {
    render(<PlayerManage {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('backToMenu'));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  // 3. Add player button calls onAddPlayer
  it('calls onAddPlayer when the add player button is clicked', () => {
    render(<PlayerManage {...defaultProps} />);
    fireEvent.click(screen.getByText('addPlayer'));
    expect(defaultProps.onAddPlayer).toHaveBeenCalledTimes(1);
  });

  // 4. Edit mode: clicking edit shows input pre-filled with player name
  it('shows a pre-filled name input when edit is clicked', () => {
    render(<PlayerManage {...defaultProps} />);

    const editButtons = screen.getAllByLabelText('editPlayer');
    fireEvent.click(editButtons[0]); // edit Alice

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Alice');
  });

  // 4b. Saving edit calls onUpdatePlayer with the new name and current avatar
  it('calls onUpdatePlayer with new name when save is clicked', () => {
    render(<PlayerManage {...defaultProps} />);

    const editButtons = screen.getAllByLabelText('editPlayer');
    fireEvent.click(editButtons[0]); // edit Alice

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Alicia' } });

    // The save button has class including 'emerald' and contains an SVG (Check icon)
    const allButtons = screen.getAllByRole('button');
    const saveButton = allButtons.find(
      (btn) => btn.className.includes('emerald') && btn.querySelector('svg')
    );
    fireEvent.click(saveButton);

    expect(defaultProps.onUpdatePlayer).toHaveBeenCalledWith('1', {
      name: 'Alicia',
      avatar: '🦊',
    });
  });

  // 5. Delete button opens confirmation modal, confirming calls onDeletePlayer
  it('opens confirmation modal on delete click and calls onDeletePlayer on confirm', () => {
    render(<PlayerManage {...defaultProps} />);

    fireEvent.click(screen.getAllByText('deletePlayer')[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    const confirmButton = Array.from(dialog.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('deletePlayer')
    );
    fireEvent.click(confirmButton);

    expect(defaultProps.onDeletePlayer).toHaveBeenCalledWith('1');
  });

  // 6. Reset button opens confirmation modal, confirming calls onResetPlayer
  it('opens confirmation modal on reset click and calls onResetPlayer on confirm', () => {
    render(<PlayerManage {...defaultProps} />);

    fireEvent.click(screen.getAllByText('resetProgress')[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    const confirmButton = Array.from(dialog.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('resetProgress')
    );
    fireEvent.click(confirmButton);

    expect(defaultProps.onResetPlayer).toHaveBeenCalledWith('1');
  });

  // 7. Delete button is disabled when only 1 player
  it('disables the delete button when there is only one player', () => {
    const singlePlayer = [{ id: '1', name: 'Alice', avatar: '🦊', canRead: true }];
    render(<PlayerManage {...defaultProps} players={singlePlayer} />);

    const deleteButton = screen.getByText('deletePlayer').closest('button');
    expect(deleteButton).toBeDisabled();
  });

  // 8. Export button creates a download via URL.createObjectURL
  it('triggers a file download when export is clicked', () => {
    storage.exportAllData.mockReturnValue({ players: [] });

    const mockObjectURL = 'blob:http://localhost/fake-url';
    const createObjectURL = vi.fn().mockReturnValue(mockObjectURL);
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        vi.spyOn(el, 'click').mockImplementation(clickSpy);
      }
      return el;
    });

    render(<PlayerManage {...defaultProps} />);
    fireEvent.click(screen.getByText('exportData'));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith(mockObjectURL);

    vi.restoreAllMocks();
  });

  // 9. Cancel in confirmation modal closes it
  it('closes the confirmation modal when cancel is clicked', () => {
    render(<PlayerManage {...defaultProps} />);

    fireEvent.click(screen.getAllByText('resetProgress')[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    const cancelButton = Array.from(dialog.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('cancel')
    );
    fireEvent.click(cancelButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
