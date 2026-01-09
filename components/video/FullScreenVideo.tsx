import { useEffect } from 'react';
import {
  TrackRefContext,
  VideoTrack,
  useRoomContext,
} from '@livekit/components-react';
import { VideoQuality, RoomEvent, Track } from 'livekit-client';
import type { MockParticipant } from './ParticipantSidebar';

type FullScreenVideoProps = {
  participant: MockParticipant;
  videoTrackRef: any;
  isDanger?: boolean;
};

export const FullScreenVideo = ({
  participant,
  videoTrackRef,
  isDanger = false,
}: FullScreenVideoProps) => {
  const room = useRoomContext();

  // Request highest quality immediately
  useEffect(() => {
    const pub = videoTrackRef?.publication;
    const track = pub?.track;
    if (!pub || !room) return;

    // 🔍 초기 상태 로깅
    console.log('[FullScreen] 초기 상태:', {
      participant: participant.name,
      trackSid: pub.trackSid,
      dimensions: track?.dimensions,
      simulcasted: pub.simulcasted,
      videoQuality: pub.videoQuality,
      subscribed: pub.subscribed,
      trackAttached: track?.attachedElements?.length > 0,
    });

    try {
      (pub as any)?.setSubscribed?.(true);
    } catch (e) {
      // ignore
    }

    const requestHighQuality = (source: string) => {
      const currentTrack = pub?.track;
      const beforeQuality = pub.videoQuality;
      const beforeDimensions = currentTrack?.dimensions;

      // 이미 HIGH면 스킵
      if (beforeQuality === VideoQuality.HIGH) {
        console.log('[FullScreen] 이미 HIGH 품질, 스킵:', { source });
        return;
      }

      // Request high-quality layer (modern API)
      if (typeof pub.setVideoQuality === 'function') {
        pub.setVideoQuality(VideoQuality.HIGH);
      } else if (typeof (pub as any).setPreferredLayer === 'function') {
        // older client/server combos may use setPreferredLayer
        (pub as any).setPreferredLayer(VideoQuality.HIGH);
      }

      // Request high subscription priority where supported
      try {
        const priorityEnum = (Track as any).Priority;
        const highPriority = priorityEnum?.HIGH ?? undefined;
        if (
          highPriority !== undefined &&
          typeof (pub as any).setPriority === 'function'
        ) {
          (pub as any).setPriority(highPriority);
        }
      } catch (e) {
        // ignore if API not present
      }

      // Prefer a large render size
      pub.setVideoDimensions?.({ width: 1920, height: 1080 });

      console.log('[FullScreen] HIGH 품질 요청:', {
        source,
        trackSid: pub.trackSid,
        beforeQuality,
        afterQuality: pub.videoQuality,
        beforeDimensions,
        afterDimensions: currentTrack?.dimensions,
        simulcasted: pub.simulcasted,
      });
    };

    // 이미 HIGH면 추가 작업 불필요
    const isAlreadyHigh = pub.videoQuality === VideoQuality.HIGH;

    let retryTimeouts: NodeJS.Timeout[] = [];

    if (isAlreadyHigh) {
      console.log('[FullScreen] 이미 HIGH 품질, 추가 요청 불필요');
    } else {
      // HIGH가 아닐 때만 요청 및 retry
      requestHighQuality('mount');

      // 트랙이 이미 attach된 경우 바로 재요청
      if (track?.attachedElements?.length > 0) {
        requestHighQuality('already-attached');
      }

      // 서버 응답 대기를 위한 retry (500ms, 1s, 2s 후)
      retryTimeouts = [500, 1000, 2000].map((delay, i) =>
        setTimeout(() => requestHighQuality(`retry-${i + 1}`), delay)
      );
    }

    // 트랙이 attach되면 재요청 (HIGH 아닐 때만)
    const handleAttached = () => {
      if (pub.videoQuality !== VideoQuality.HIGH) {
        console.log('[FullScreen] 트랙 attached, 재요청');
        requestHighQuality('attached');
      }
    };
    track?.on('attached', handleAttached);

    // 🔍 비디오 크기 변경 감지
    const handleVideoDimensionsChanged = () => {
      console.log('[FullScreen] 해상도 변경됨:', {
        participant: participant.name,
        dimensions: track?.dimensions,
        videoQuality: pub.videoQuality,
        timestamp: new Date().toISOString(),
      });
    };

    // 🔍 품질 변경 감지
    const handleVideoQualityChanged = (quality: VideoQuality) => {
      console.log('[FullScreen] 품질 변경됨:', {
        participant: participant.name,
        newQuality: quality,
        dimensions: track?.dimensions,
        timestamp: new Date().toISOString(),
      });
    };

    // Keep quality high if track gets resubscribed
    const handleTrackSubscribed = (subscribedTrack: any, publication: any) => {
      if (
        subscribedTrack.kind === Track.Kind.Video &&
        publication.trackSid === pub.trackSid
      ) {
        console.log('[FullScreen] 트랙 재구독:', {
          trackSid: publication.trackSid,
          dimensions: subscribedTrack.dimensions,
        });
        requestHighQuality('track-subscribed');
      }
    };

    // 이벤트 리스너 등록
    track?.on('videoDimensionsChanged', handleVideoDimensionsChanged);
    pub.on('videoQualityChanged', handleVideoQualityChanged);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

    // Cleanup: remove listeners and timers
    return () => {
      track?.off('attached', handleAttached);
      track?.off('videoDimensionsChanged', handleVideoDimensionsChanged);
      pub.off('videoQualityChanged', handleVideoQualityChanged);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      retryTimeouts.forEach(clearTimeout);
    };
  }, [videoTrackRef, participant.name, room]);

  return (
    <>
      {/* Background Blur Effect */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 40,
          pointerEvents: 'none',
        }}
      />

      {/* Video Container */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          left: '280px',
          right: '520px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          {/* Video */}
          <div
            style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: isDanger
                ? '0 0 0 4px #ef4444, 0 0 40px rgba(239, 68, 68, 0.6), 0 40px 100px rgba(0, 0, 0, 0.6)'
                : '0 40px 100px rgba(0, 0, 0, 0.6)',
              background: '#000000',
              height: '90vh',
              aspectRatio: '9 / 16', // Maintains portrait aspect ratio
              animation: isDanger ? 'dangerPulse 1.5s ease-in-out infinite' : undefined,
            }}
          >
            {isDanger && (
              <style>
                {`
                  @keyframes dangerPulse {
                    0%, 100% { box-shadow: 0 0 0 4px #ef4444, 0 0 40px rgba(239, 68, 68, 0.6), 0 40px 100px rgba(0, 0, 0, 0.6); }
                    50% { box-shadow: 0 0 0 6px #ef4444, 0 0 60px rgba(239, 68, 68, 0.8), 0 40px 100px rgba(0, 0, 0, 0.6); }
                  }
                `}
              </style>
            )}
            <TrackRefContext.Provider value={videoTrackRef}>
              <VideoTrack
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </TrackRefContext.Provider>
          </div>

          {/* Participant Name Label */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              padding: '12px 20px',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isDanger ? '#ef4444' : '#10b981',
                animation: isDanger ? 'pulse 1s ease-in-out infinite' : undefined,
              }}
            />
            {participant.name}
          </div>

          {/* Live Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              padding: '10px 16px',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
              }}
              className="animate-pulse"
            />
            실시간
          </div>
        </div>
      </div>
    </>
  );
};
