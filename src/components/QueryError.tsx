import { RefreshCw } from 'lucide-react';

export default function QueryError({ onRetry, message = 'We couldn’t load your memories.' }: { onRetry: () => void; message?: string }) {
  return <div role="alert" className="surface rounded-2xl p-8 text-center">
    <p className="font-semibold">{message}</p>
    <p className="muted mt-2 text-sm">Check your connection and try again.</p>
    <button type="button" onClick={onRetry} className="secondary-button mt-4"><RefreshCw className="h-4 w-4" />Try again</button>
  </div>;
}
