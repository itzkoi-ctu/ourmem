export interface VideoJob {
  id: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  message?: string;
}

/** ApiResponse omits null fields; React Query must never receive undefined. */
export function parseVideoStatus(response: { success: boolean; data?: VideoJob | null }): VideoJob | null {
  if (response.success !== true) throw new Error('Unable to check video processing');
  if (response.data == null) return null;
  if (!response.data.id || !['PROCESSING', 'READY', 'FAILED'].includes(response.data.status)) {
    throw new Error('Invalid video processing status');
  }
  return response.data;
}
