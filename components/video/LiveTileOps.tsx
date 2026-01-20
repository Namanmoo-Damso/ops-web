'use client';

import { memo } from 'react';
import { TrackRefContext, VideoTrack } from '@livekit/components-react';
import { getInitials } from './VideoTiles';
import styles from '../../app/monitoring/page.module.css';

export interface LiveTileOpsProps {
  trackRef: any;
  displayName: string;
  roomName: string;
  videoOff: boolean;
  suppressVideo?: boolean;
  onClick?: (roomName: string, participantId: string, trackRef: any) => void;
  participantId: string;
  isDanger?: boolean;
  riskLevel?: 'normal' | 'caution' | 'critical';
}

// Color configurations based on risk level
const RISK_COLORS = {
  normal: { border: 'transparent', glow: 'transparent', dot: '#10b981' },
  caution: { border: '#eab308', glow: 'rgba(234, 179, 8, 0.5)', dot: '#eab308' },
  critical: { border: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', dot: '#ef4444' },
};

export const LiveTileOps = memo(function LiveTileOps({
  trackRef,
  displayName,
  roomName,
  videoOff,
  suppressVideo,
  onClick,
  participantId,
  isDanger,
  riskLevel = 'normal',
}: LiveTileOpsProps) {
  const cameraOff = videoOff;
  const showVideo = !cameraOff && !suppressVideo;

  // Determine effective risk level based on riskLevel prop (isDanger is for backward compatibility)
  const effectiveRiskLevel = riskLevel !== 'normal' ? riskLevel : (isDanger ? 'critical' : 'normal');
  const colors = RISK_COLORS[effectiveRiskLevel];
  const isAlert = effectiveRiskLevel !== 'normal';

  const handleClick = () => {
    if (onClick) {
      onClick(roomName, participantId, trackRef);
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
        boxShadow: isAlert
          ? `0 0 0 3px ${colors.border}, 0 0 20px ${colors.glow}`
          : undefined,
        animation: isAlert
          ? `${effectiveRiskLevel}Pulse 1.5s ease-in-out infinite`
          : undefined,
      }}
      onClick={handleClick}
    >
      <style>
        {`
          @keyframes criticalPulse {
            0%, 100% { box-shadow: 0 0 0 3px #ef4444, 0 0 20px rgba(239, 68, 68, 0.5); }
            50% { box-shadow: 0 0 0 4px #ef4444, 0 0 30px rgba(239, 68, 68, 0.8); }
          }
          @keyframes cautionPulse {
            0%, 100% { box-shadow: 0 0 0 3px #eab308, 0 0 20px rgba(234, 179, 8, 0.5); }
            50% { box-shadow: 0 0 0 4px #eab308, 0 0 30px rgba(234, 179, 8, 0.8); }
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
                backgroundColor: colors.dot,
                animation: isAlert
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
});
