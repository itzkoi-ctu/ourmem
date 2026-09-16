import { useEffect, useRef, useState } from 'react';
import { RotateCw, FlipHorizontal2, FlipVertical2, Undo2, X } from 'lucide-react';
import PhotoDialog from './PhotoDialog';

interface Props {
  source: File | string;
  onSave: (file: File) => Promise<void> | void;
  onClose: () => void;
}

// Rotation is clockwise; flips are applied to the displayed axes.
export default function ImageEditor({ source, onSave, onClose }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const original = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => { original.current = image; setReady(true); };
    image.onerror = () => setError('Unable to load the original image for editing. Please try again.');
    image.src = url;
    return () => { image.onload = null; image.onerror = null; if (typeof source !== 'string') URL.revokeObjectURL(url); };
  }, [source]);

  const draw = (target: HTMLCanvasElement, maxSize?: number) => {
    const image = original.current;
    if (!image) throw new Error('Image is not ready');
    const swapped = rotation % 180 !== 0;
    const width = swapped ? image.naturalHeight : image.naturalWidth;
    const height = swapped ? image.naturalWidth : image.naturalHeight;
    const scale = maxSize ? Math.min(1, maxSize / Math.max(width, height)) : 1;
    target.width = Math.max(1, Math.round(width * scale));
    target.height = Math.max(1, Math.round(height * scale));
    const ctx = target.getContext('2d');
    if (!ctx) throw new Error('Image editing is not available in this browser');
    ctx.translate(target.width / 2, target.height / 2);
    ctx.scale(flipX ? -scale : scale, flipY ? -scale : scale);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  };

  useEffect(() => { if (ready && canvas.current) draw(canvas.current, 1200); }, [ready, rotation, flipX, flipY]);

  const save = async () => {
    setSaving(true); setError('');
    try {
      const output = document.createElement('canvas');
      draw(output);
      // PNG preserves transparency and avoids cumulative JPEG loss on existing photos.
      const type = typeof source !== 'string' && source.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(
        result => result ? resolve(result) : reject(new Error('Unable to export image')), type, 0.95));
      output.width = output.height = 0;
      if (blob.size > 10 * 1024 * 1024) throw new Error('Edited image exceeds 10 MB. Please use a smaller image.');
      const name = typeof source === 'string' ? 'edited-photo' : source.name.replace(/\.[^.]+$/, '');
      await onSave(new File([blob], `${name}.${type === 'image/png' ? 'png' : 'jpg'}`, { type }));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save image. Your original has not been changed.');
    } finally { setSaving(false); }
  };

  return <PhotoDialog onClose={() => { if (!saving) onClose(); }}>
    <section className="surface flex max-h-full w-full max-w-3xl flex-col overflow-auto rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">Edit photo</h2><p className="muted text-sm">Rotate or flip. Changes are applied only when you save.</p></div>
        <button type="button" aria-label="Cancel image editing" disabled={saving} onClick={onClose} className="secondary-button"><X className="h-5 w-5" /></button>
      </div>
      <div className="my-4 flex min-h-32 items-center justify-center rounded-xl bg-stone-100 p-3 dark:bg-stone-950">
        {!ready && !error && <p role="status">Loading original image…</p>}
        <canvas ref={canvas} className={`${ready ? 'block' : 'hidden'} max-h-[50dvh] max-w-full object-contain`} />
      </div>
      <fieldset disabled={!ready || saving} className="flex flex-wrap gap-2">
        <button type="button" className="secondary-button" onClick={() => { setRotation(r => (r + 90) % 360); setFlipX(flipY); setFlipY(flipX); }}><RotateCw className="h-4 w-4" />90°</button>
        <button type="button" className="secondary-button" aria-pressed={flipX} onClick={() => setFlipX(v => !v)}><FlipHorizontal2 className="h-4 w-4" />Flip horizontal</button>
        <button type="button" className="secondary-button" aria-pressed={flipY} onClick={() => setFlipY(v => !v)}><FlipVertical2 className="h-4 w-4" />Flip vertical</button>
        <button type="button" className="secondary-button" onClick={() => { setRotation(0); setFlipX(false); setFlipY(false); }}><Undo2 className="h-4 w-4" />Reset</button>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="button" disabled={!ready || saving || (rotation === 0 && !flipX && !flipY)} onClick={save}
        className="mt-4 rounded-xl bg-couple-600 px-4 py-3 font-semibold text-white hover:bg-couple-700">{saving ? 'Saving…' : 'Save changes'}</button>
    </section>
  </PhotoDialog>;
}
