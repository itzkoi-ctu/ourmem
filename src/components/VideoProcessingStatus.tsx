import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';

export interface VideoJob { id: string; status: 'PROCESSING' | 'READY' | 'FAILED'; message?: string; }
export function useVideoStatus(sessionId?: string) {
  const client = useQueryClient();
  const query = useQuery<VideoJob | null>({
    queryKey: ['video-status', sessionId],
    queryFn: async () => (await apiClient.get(`/sessions/${sessionId}/video/status`)).data.data,
    enabled: !!sessionId,
    refetchInterval: query => query.state.data?.status === 'PROCESSING' ? 3000 : false,
  });
  const jobId = query.data?.id;
  const status = query.data?.status;
  useEffect(() => {
    if (status === 'READY') {
      client.invalidateQueries({ queryKey: ['sessions'] });
      client.invalidateQueries({ queryKey: ['public', 'sessions'] });
    }
  }, [jobId, status, client]);
  return query;
}

export default function VideoProcessingStatus({ sessionId }: { sessionId?: string }) {
  const { data, isError, refetch } = useVideoStatus(sessionId);
  if (isError) return <p role="alert" className="muted text-sm">Unable to check video processing. <button className="underline" onClick={() => refetch()}>Try again</button></p>;
  if (!data || data.status === 'READY') return null;
  return <div role={data.status === 'FAILED' ? 'alert' : 'status'} className="surface rounded-2xl p-4 text-sm">
    <p className="font-semibold">{data.status === 'PROCESSING' ? 'Processing video…' : 'Video processing failed'}</p>
    <p className="muted mt-1">{data.status === 'PROCESSING'
      ? 'Your video is being prepared for playback. You can leave this page; the current video stays available until the new one is ready.'
      : data.message || 'Please select the file again and retry. The previous video is unchanged.'}</p>
  </div>;
}
