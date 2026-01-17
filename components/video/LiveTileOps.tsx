'use client';

import { TrackRefContext, VideoTrack } from '@livekit/components-react';
import { getInitials } from './VideoTiles';
import styles from '../../app/monitoring/page.module.css';

export interface LiveTileOpsProps {
  trackRef: any;
  displayName: string;
  roomName: string;
  videoOff: boolean;
  suppressVideo?: boolean;
  onClick?: (participantId: string) => void;
  participantId: string;
  isDanger?: boolean;
}

export const LiveTileOps = ({
  trackRef,
  displayName,
  videoOff,
  suppressVideo,
  onClick,
  participantId,
  isDanger,
}: LiveTileOpsProps) => {
  const cameraOff = videoOff;
  const showVideo = !cameraOff && !suppressVideo;

  const handleClick = () => {
    if (onClick) {
      onClick(participantId);
    }
  };

  return (
    <div
      className={styles.tile}
      style={{
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: isDanger
          ? '0 0 0 3px #ef4444, 0 0 20px rgba(239, 68, 68, 0.5)'
          : undefined,
        animation: isDanger
          ? 'dangerPulse 1.5s ease-in-out infinite'
          : undefined,
      }}
      onClick={handleClick}
    >
      <style>
        {`
          @keyframes dangerPulse {
            0%, 100% { box-shadow: 0 0 0 3px #ef4444, 0 0 20px rgba(239, 68, 68, 0.5); }
            50% { box-shadow: 0 0 0 4px #ef4444, 0 0 30px rgba(239, 68, 68, 0.8); }
          }
        `}
      </style>
      <div className={styles.tileMedia}>
        {showVideo ? (
          <TrackRefContext.Provider value={trackRef}>
            <VideoTrack className={styles.video} />
          </TrackRefContext.Provider>
        ) : (
          <div className={styles.avatarFallback}>
            {getInitials(displayName)}
          </div>
        )}
        <div className={styles.tileFooter}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isDanger ? '#ef4444' : '#10b981',
                animation: isDanger
                  ? 'pulse 1s ease-in-out infinite'
                  : undefined,
              }}
            />
            <span
              className={styles.tileName}
              style={{ color: '#000000', textShadow: 'none' }}
            >
              {displayName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
