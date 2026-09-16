import { ReactNode, useEffect, useRef } from 'react';

export default function PhotoDialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return (
    <dialog ref={ref} aria-label="Photo viewer" onCancel={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-black/90 px-3 pb-3 pt-16 text-stone-800 backdrop:bg-transparent open:flex open:items-center open:justify-center dark:text-stone-100 sm:px-6 sm:pb-6">
      {children}
    </dialog>
  );
}
