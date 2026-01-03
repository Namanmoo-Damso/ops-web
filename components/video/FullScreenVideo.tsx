import { TrackRefContext, VideoTrack } from '@livekit/components-react';
import type { MockParticipant } from './ParticipantSidebar';

type FullScreenVideoProps = {
  participant: MockParticipant;
  videoTrackRef: any;
};

export const FullScreenVideo = ({
  participant,
  videoTrackRef,
}: FullScreenVideoProps) => {
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
          pointerEvents: 'none', // Don't block clicks - let the backdrop handle it
        }}
      />

      {/* Video Container */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          left: '280px', // Account for SidebarLayout
          right: '520px', // Account for ParticipantDetailSidebar
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          pointerEvents: 'none', // Don't block clicks to backdrop
        }}
      >
        {/* Video Container */}
        <div
          style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto', // Re-enable pointer events on the video itself
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
              maxWidth: '100%',
              maxHeight: '90vh',
            }}
          >
            <TrackRefContext.Provider value={videoTrackRef}>
              <VideoTrack
                style={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  width: 'auto',
                  height: 'auto',
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
