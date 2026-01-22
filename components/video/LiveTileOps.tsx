'use client';

import { memo, useEffect } from 'react';
import { TrackRefContext, VideoTrack } from '@livekit/components-react';
import { VideoQuality, RemoteTrackPublication } from 'livekit-client';
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

  // Grid 타일은 LOW 품질 요청 (FullScreen이 아닐 때만)
  // 주의: 구독 해제하면 안 됨 - FullScreen과 같은 publication 공유
  useEffect(() => {
    const pub = trackRef?.publication;
    if (!pub || !(pub instanceof RemoteTrackPublication)) return;

    // FullScreen이 활성화되면 품질 설정을 FullScreen에 위임
    if (suppressVideo) {
      console.log('[GridTile] FullScreen 활성 - 품질 설정 위임:', { participantId });
      return;
    }

    // Grid 모드: HIGH 품질 요청
    if (typeof pub.setVideoQuality === 'function') {
      pub.setVideoQuality(VideoQuality.HIGH);
    }
    // 렌더 사이즈 힌트 (1080p)
    pub.setVideoDimensions?.({ width: 1920, height: 1080 });
    console.log('[GridTile] HIGH 품질 설정:', { participantId });
  }, [trackRef, suppressVideo, participantId]);

  // Grid 모니터링 (FullScreen과 비교용) - suppressVideo가 false일 때만
  useEffect(() => {
    const pub = trackRef?.publication;
    const track = pub?.track;
    if (!pub || !track || suppressVideo) return;

    let lastFramesReceived = 0;
    let freezeCount = 0;

    const gridMonitor = setInterval(async () => {
      let framesReceived = 0;
      let freezeCountDelta = 0;
      let jitter = 0;
      let frameWidth = 0;
      let frameHeight = 0;

      try {
        const receiver = (track as any)?.receiver;
        if (receiver) {
          const stats = await receiver.getStats();
          stats.forEach((report: any) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              framesReceived = report.framesReceived || 0;
              freezeCountDelta = (report.freezeCount || 0) - freezeCount;
              freezeCount = report.freezeCount || 0;
              jitter = report.jitter || 0;
              frameWidth = report.frameWidth || 0;
              frameHeight = report.frameHeight || 0;
            }
          });
        }
      } catch (e) {
        // stats 접근 실패 시 무시
      }

      const framesDelta = framesReceived - lastFramesReceived;
      const isFreezing = framesDelta < 10 || freezeCountDelta > 0;

      // 해상도 정보 추가
      const resolution = `${frameWidth}x${frameHeight}`;

      if (isFreezing) {
        console.warn('[GridTile:Monitor] ⚠️ FREEZE 감지:', {
          participantId,
          resolution,
          framesReceived: framesDelta,
          freezeCountDelta,
          jitter: (jitter * 1000).toFixed(1) + 'ms',
          videoQuality: 'HIGH',
        });
      } else {
        console.log('[GridTile:Monitor] 📊 상태:', {
          participantId,
          resolution,
          framesReceived: framesDelta,
          expectedFps: (framesDelta / 3).toFixed(1),
          videoQuality: 'HIGH',
        });
      }

      lastFramesReceived = framesReceived;
    }, 3000);

    return () => clearInterval(gridMonitor);
  }, [trackRef, suppressVideo, participantId]);

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
