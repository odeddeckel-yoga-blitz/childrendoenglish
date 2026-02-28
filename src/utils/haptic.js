export const haptic = (pattern) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (pattern === 'success') navigator.vibrate(10);
    else if (pattern === 'error') navigator.vibrate([20, 30, 20]);
  }
};
