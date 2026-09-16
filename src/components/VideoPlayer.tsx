import { useEffect, useState } from 'react';

export default function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <div className="flex flex-col items-center overflow-hidden rounded-2xl border border-stone-200 bg-black dark:border-stone-800">
    <video key={src} src={src} poster={poster} controls playsInline preload="metadata"
      onError={() => setFailed(true)} className="block max-h-[75dvh] max-w-full w-auto h-auto mx-auto object-contain" />
    {failed && <p role="alert" className="p-4 text-sm text-white">This video could not be played. Try an MP4 encoded with H.264 video and AAC audio.</p>}
  </div>;
}
