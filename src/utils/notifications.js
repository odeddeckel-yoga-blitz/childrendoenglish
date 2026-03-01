const STORAGE_KEY = 'childrendoenglish-notif-enabled';

export function isNotificationSupported() {
  return 'Notification' in window;
}

export function isNotificationEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true' && Notification.permission === 'granted';
  } catch {
    return false;
  }
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return false;
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    localStorage.setItem(STORAGE_KEY, 'true');
    return true;
  }
  return false;
}

export function disableNotifications() {
  localStorage.setItem(STORAGE_KEY, 'false');
}

/**
 * Check if user should get a streak reminder.
 * Called when app opens — shows a local notification if:
 * - User hasn't played today
 * - User has an active streak
 * - Notifications are enabled
 */
export function checkStreakReminder(stats) {
  if (!isNotificationEnabled()) return;
  if (!stats?.currentStreak || stats.currentStreak < 1) return;

  const today = new Date().toISOString().slice(0, 10);
  const lastPlayed = stats.dailyGoal?.date;

  // Already played today — no reminder needed
  if (lastPlayed === today) return;

  // Check if we already showed a reminder today
  const lastReminder = localStorage.getItem('childrendoenglish-last-reminder');
  if (lastReminder === today) return;

  localStorage.setItem('childrendoenglish-last-reminder', today);

  new Notification('Keep your streak going!', {
    body: `You have a ${stats.currentStreak}-day streak. Play today to keep it!`,
    icon: '/icon-192.png',
    tag: 'streak-reminder',
  });
}
