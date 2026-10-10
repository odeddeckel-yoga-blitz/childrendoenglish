import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WordCheck from '../components/WordCheck';
import { getWordById } from '../data/words';
import { loadLocale } from '../utils/i18n';

vi.mock('../utils/sound', () => ({ speakWord: vi.fn(), playSound: vi.fn(), isTTSAvailable: () => true, initTTS: vi.fn() }));
vi.mock('../utils/learnBeacon', () => ({ sendLearn: vi.fn(), sendLearnBatch: vi.fn() }));
import { sendLearn, sendLearnBatch } from '../utils/learnBeacon';

const word = getWordById('cat');
const pick = (id) => fireEvent.click(document.querySelector(`button[data-opt="${id}"]`));

describe('WordCheck', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });

  it('runs 3 probes for a reader, beacons each answer per probe, then takes a feedback tap', async () => {
    const onDone = vi.fn();
    render(<WordCheck word={word} lang="en" canRead onDone={onDone} />);
    expect(screen.getByText('Tap the picture you hear')).toBeInTheDocument();
    expect(document.querySelectorAll('button[data-opt]')).toHaveLength(4);
    pick('cat');
    expect(sendLearnBatch).toHaveBeenLastCalledWith([{ e: 'ans_ok', i: 'cat' }, { e: 'ansm_ok', i: 'cat@aud' }]);
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(screen.getByText('Which word is this?')).toBeInTheDocument();
    const wrong = [...document.querySelectorAll('button[data-opt]')].map((b) => b.dataset.opt).find((id) => id !== 'cat');
    pick(wrong);
    expect(sendLearnBatch).toHaveBeenLastCalledWith([{ e: 'ans_no', i: 'cat' }, { e: 'ansm_no', i: 'cat@img' }]);
    await act(async () => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText('What does it mean?')).toBeInTheDocument();
    pick('cat');
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(screen.getByText('2 of 3 right')).toBeInTheDocument();
    fireEvent.click(document.querySelector('button[data-fb="img"]'));
    expect(sendLearn).toHaveBeenCalledWith('wfb', 'cat@img');
    expect(screen.getByText('Thanks! That helps us fix it.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back to home'));
    expect(onDone).toHaveBeenCalled();
  });

  it('pre-readers get only the listening probe, and Hebrew UI renders Hebrew', async () => {
    render(<WordCheck word={word} lang="en" canRead={false} onDone={() => {}} />);
    expect(screen.getByText('1/1')).toBeInTheDocument();
    pick('cat');
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(screen.getByText('1 of 1 right')).toBeInTheDocument();
    vi.useRealTimers();
    await loadLocale('he');
    render(<WordCheck word={word} lang="he" canRead onDone={() => {}} />);
    expect(screen.getByText('הקישו על התמונה ששמעתם')).toBeInTheDocument();
  });
});
