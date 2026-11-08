// Cold speech-sync run (kit §8g): cache off + 300 ms / 200 KB/s, applied after the page loads — the same
// conditions as e2e/speech-sync.spec.js. A word that loads slowly must still finish before the screen moves on.
export async function cold(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 200 * 1024, uploadThroughput: 100 * 1024 });
}
