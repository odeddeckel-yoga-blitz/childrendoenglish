// Get image URL for a word
export const getImageUrl = (word) => {
  return word.imageUrl || `/images/${word.id}.webp`;
};

// Preload a single image with timeout
export const preloadImage = (word) => {
  const imageUrl = getImageUrl(word);

  const load = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ ...word, imageUrl });
    img.onerror = () => reject(new Error(`Missing image: ${imageUrl}`));
    img.src = imageUrl;
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout loading: ${imageUrl}`)), 15000)
  );

  return Promise.race([load, timeout]);
};

// Preload batch of images, returns { loaded, missing }
export const preloadImages = async (words, onProgress) => {
  let completed = 0;
  const loaded = [];
  const missing = [];

  await Promise.all(
    words.map(async (word) => {
      try {
        const result = await preloadImage(word);
        loaded.push(result);
      } catch {
        missing.push(word);
      } finally {
        completed++;
        onProgress?.(completed / words.length);
      }
    })
  );

  return { loaded, missing };
};
