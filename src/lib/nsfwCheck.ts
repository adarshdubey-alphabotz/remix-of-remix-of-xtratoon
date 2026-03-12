// Client-side NSFW detection with resilient CDN/model fallback
// Loads TensorFlow.js + NSFWJS only when first needed (~5MB one-time)

let nsfwModel: any = null;
let loadingPromise: Promise<any> | null = null;

const TFJS_CDNS = [
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
  'https://unpkg.com/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
];

const NSFWJS_CDNS = [
  'https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/nsfwjs.min.js',
  'https://unpkg.com/nsfwjs@2.4.2/dist/nsfwjs.min.js',
];

const MODEL_BASE_URLS = [
  undefined,
  'https://unpkg.com/nsfwjs@2.4.2/dist/model/',
  'https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/model/',
];

function getGlobal() {
  return window as any;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any).__loaded) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      (script as any).__loaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function loadScriptWithFallback(urls: string[]) {
  let lastError: unknown = null;
  for (const url of urls) {
    try {
      await loadScript(url);
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to load script from all CDNs');
}

async function loadModelWithFallback(nsfwjs: any) {
  let lastError: unknown = null;

  for (const modelBase of MODEL_BASE_URLS) {
    try {
      if (modelBase) {
        return await nsfwjs.load(modelBase);
      }
      return await nsfwjs.load();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to load NSFW model from all mirrors');
}

async function getModel() {
  if (nsfwModel) return nsfwModel;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const g = getGlobal();

    if (!g.tf) {
      await loadScriptWithFallback(TFJS_CDNS);
    }

    if (!g.nsfwjs) {
      await loadScriptWithFallback(NSFWJS_CDNS);
    }

    const nsfwjs = g.nsfwjs;
    if (!nsfwjs) throw new Error('NSFWJS not loaded');

    nsfwModel = await loadModelWithFallback(nsfwjs);
    return nsfwModel;
  })().catch((err) => {
    loadingPromise = null;
    throw err;
  });

  return loadingPromise;
}

export interface NSFWResult {
  isNSFW: boolean;
  predictions: { className: string; probability: number }[];
}

/**
 * Check if an image (File or HTMLImageElement) is NSFW.
 * Returns true if Porn or Hentai probability > 0.3
 */
export async function checkImageNSFW(input: File | HTMLImageElement): Promise<NSFWResult> {
  const model = await getModel();

  let img: HTMLImageElement;
  if (input instanceof File) {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = URL.createObjectURL(input);
    });
  } else {
    img = input;
  }

  const predictions = await model.classify(img);

  // Clean up object URL if we created one
  if (input instanceof File && img.src.startsWith('blob:')) {
    URL.revokeObjectURL(img.src);
  }

  const porn = predictions.find((p: any) => p.className === 'Porn')?.probability || 0;
  const hentai = predictions.find((p: any) => p.className === 'Hentai')?.probability || 0;
  const sexy = predictions.find((p: any) => p.className === 'Sexy')?.probability || 0;

  return {
    isNSFW: porn > 0.3 || hentai > 0.3 || (sexy > 0.5 && (porn + hentai) > 0.2),
    predictions,
  };
}

/**
 * Check multiple files. Returns first NSFW result or null if all safe.
 */
export async function checkImagesNSFW(files: File[]): Promise<{ isNSFW: boolean; index: number } | null> {
  for (let i = 0; i < files.length; i++) {
    const result = await checkImageNSFW(files[i]);
    if (result.isNSFW) return { isNSFW: true, index: i };
  }
  return null;
}
