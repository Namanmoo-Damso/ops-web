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
};

export const FullScreenVideo = ({
  participant,
  videoTrackRef,
}: FullScreenVideoProps) => {
  const room = useRoomContext();

  // Request highest quality immediately
  useEffect(() => {
    const pub = videoTrackRef?.publication;
    if (!pub || !room) return;

    try {
      (pub as any)?.setSubscribed?.(true);
    } catch (e) {
      // ignore
    }

    const requestHighQuality = () => {
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
    };

    requestHighQuality();

    // Keep quality high if track gets resubscribed
    const handleTrackSubscribed = (track: any, publication: any) => {
      if (
        track.kind === Track.Kind.Video &&
        publication.trackSid === pub.trackSid
      ) {
        requestHighQuality();
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

    // Cleanup: remove listener but keep requested quality (do not downgrade)
    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
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
              boxShadow: '0 40px 100px rgba(0, 0, 0, 0.6)',
              background: '#000000',
              maxHeight: '90vh',
              aspectRatio: '9 / 16', // Maintains portrait aspect ratio
            }}
          >
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
                background: '#10b981',
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
