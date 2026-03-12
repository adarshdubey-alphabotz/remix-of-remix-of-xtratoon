// NSFWJS client-side NSFW detection via CDN
// Loads TensorFlow.js + NSFWJS model only when first needed (~5MB one-time)

let nsfwModel: any = null;
let loadingPromise: Promise<any> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function getModel() {
  if (nsfwModel) return nsfwModel;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/nsfwjs@4.1.0/dist/nsfwjs.min.js');
    const nsfwjs = (window as any).nsfwjs;
    if (!nsfwjs) throw new Error('NSFWJS not loaded');
    nsfwModel = await nsfwjs.load('https://nsfwjs.com/quant_nsfw_mobilenet/', { size: 224 });
    return nsfwModel;
  })();

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
