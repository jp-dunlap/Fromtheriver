const FONT_FAMILY = 'DejaVu Sans Arabic';
const FONT_BASE64_PATH = '/fonts/dejavu-sans-arabic.woff.base64';

let loadingPromise: Promise<void> | null = null;

const decodeBase64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }
  return bytes.buffer;
};

const fetchFontData = async (): Promise<ArrayBuffer> => {
  const response = await fetch(FONT_BASE64_PATH, {
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Arabic font: ${response.status}`);
  }

  const base64 = (await response.text()).trim();
  return decodeBase64ToArrayBuffer(base64);
};

export const ensureArabicFontLoaded = (): Promise<void> => {
  if (
    typeof document === 'undefined' ||
    typeof FontFace === 'undefined' ||
    typeof fetch === 'undefined'
  ) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = fetchFontData()
    .then((arrayBuffer) => {
      const fontFace = new FontFace(FONT_FAMILY, arrayBuffer, {
        style: 'normal',
        weight: '400',
        display: 'swap',
      });
      return fontFace.load().then((loadedFace) => {
        document.fonts.add(loadedFace);
      });
    })
    .catch((error) => {
      console.error('Failed to load Arabic font', error);
      loadingPromise = null;
    });

  return loadingPromise;
};

export default ensureArabicFontLoaded;
