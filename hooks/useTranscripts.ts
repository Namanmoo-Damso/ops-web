import { useEffect, useState, useCallback, useRef } from 'react';

export type Transcript = {
  id: string;
  speakerId: string;
  speakerType: 'user' | 'agent';
  text: string;
  timestamp: string;
};

type UseTranscriptsOptions = {
  apiBase: string;
  roomName: string | null;
  enabled?: boolean;
  pollInterval?: number; // milliseconds
};

export function useTranscripts({
  apiBase,
  roomName,
  enabled = true,
  pollInterval = 2000, // Poll every 2 seconds
}: UseTranscriptsOptions) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTranscripts = useCallback(async () => {
    if (!apiBase || !roomName || !enabled) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/v1/transcripts/room/${roomName}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch transcripts: ${response.status}`);
      }

      const data = await response.json();
      setTranscripts(data.transcripts || []);
      setError(null);
    } catch (err) {
      console.error('[useTranscripts] Failed to fetch transcripts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transcripts');
    } finally {
      setLoading(false);
    }
  }, [apiBase, roomName, enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled && roomName) {
      setLoading(true);
      fetchTranscripts();
    }
  }, [enabled, roomName, fetchTranscripts]);

  // Polling for real-time updates
  useEffect(() => {
    if (!enabled || !roomName || !pollInterval) {
      return;
    }

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchTranscripts();
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, roomName, pollInterval, fetchTranscripts]);

  return {
    transcripts,
    loading,
    error,
    refetch: fetchTranscripts,
  };
}
