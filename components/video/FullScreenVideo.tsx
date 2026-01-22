import { useEffect, useState, useRef, useCallback } from 'react';
import {
  TrackRefContext,
  VideoTrack,
  useRoomContext,
} from '@livekit/components-react';
import { VideoQuality, RoomEvent, Track, ConnectionQuality } from 'livekit-client';
import type { MockParticipant } from './ParticipantSidebar';
import Slider from '../ui/Slider';

type FullScreenVideoProps = {
  participant: MockParticipant;
  videoTrackRef: any;
  isDanger?: boolean;
  riskLevel?: 'normal' | 'caution' | 'critical';
  isHeaderHidden?: boolean;
};

// Color configurations based on risk level
const RISK_COLORS = {
  normal: { border: 'transparent', glow: 'transparent', dot: '#10b981' },
  caution: { border: '#eab308', glow: 'rgba(234, 179, 8, 0.6)', dot: '#eab308' },
  critical: { border: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)', dot: '#ef4444' },
};

const VOLUME_STORAGE_KEY = 'fullscreen-volume';

const getStoredVolume = (): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored) {
      return Number(stored) || 0;
    }
  } catch {
    // ignore
  }
  return 0;
};

const saveVolume = (volume: number) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  } catch {
    // ignore
  }
};

export const FullScreenVideo = ({
  participant,
  videoTrackRef: externalVideoTrackRef,
  isDanger = false,
  riskLevel = 'normal',
  isHeaderHidden = false,
}: FullScreenVideoProps) => {
  // Determine effective risk level based on riskLevel prop (isDanger is for backward compatibility)
  const effectiveRiskLevel = riskLevel !== 'normal' ? riskLevel : (isDanger ? 'critical' : 'normal');
  const colors = RISK_COLORS[effectiveRiskLevel];
  const isAlert = effectiveRiskLevel !== 'normal';
  const room = useRoomContext();
  const [volume, setVolume] = useState(() => getStoredVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeControlRef = useRef<HTMLDivElement>(null);
  const [resolvedTrackRef, setResolvedTrackRef] = useState<any>(
    externalVideoTrackRef,
  );

  // If no external trackRef provided, find it from room context
  useEffect(() => {
    if (externalVideoTrackRef) {
      setResolvedTrackRef(externalVideoTrackRef);
      return;
    }

    if (!room || !participant.id) return;

    // Find the participant in the room
    const roomParticipant = room.remoteParticipants.get(participant.id);
    if (!roomParticipant) {
      console.warn(
        '[FullScreenVideo] Participant not found in room:',
        participant.id,
      );
      return;
    }

    // Find video track
    const videoPublication = Array.from(
      roomParticipant.trackPublications.values(),
    ).find(pub => pub.kind === Track.Kind.Video && pub.track);

    if (videoPublication) {
      const trackRef = {
        participant: roomParticipant,
        publication: videoPublication,
        source: videoPublication.source,
      };
      console.log('[FullScreenVideo] Resolved trackRef from room:', trackRef);
      setResolvedTrackRef(trackRef);
    } else {
      console.warn(
        '[FullScreenVideo] No video track found for participant:',
        participant.id,
      );
    }
  }, [room, participant.id, externalVideoTrackRef]);

  // Use resolved trackRef for all operations
  const videoTrackRef = resolvedTrackRef;

  // Save volume to storage when it changes
  useEffect(() => {
    saveVolume(volume);
  }, [volume]);

  // Close volume slider when clicking outside
  useEffect(() => {
    if (!showVolumeSlider) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeControlRef.current &&
        !volumeControlRef.current.contains(event.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider]);

  // Apply volume to all audio elements (RoomAudioRenderer creates audio elements in DOM)
  useEffect(() => {
    const volumeValue = volume / 100;

    const applyVolume = (element: HTMLMediaElement) => {
      if (element.volume !== volumeValue) {
        element.volume = volumeValue;
      }
    };

    const applyToAll = () => {
      document.querySelectorAll('audio, video').forEach(el => {
        applyVolume(el as HTMLMediaElement);
      });
    };

    // Apply to existing elements
    applyToAll();

    // Watch for new audio/video elements
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLMediaElement) {
            applyVolume(node);
          }
          if (node instanceof Element) {
            node.querySelectorAll('audio, video').forEach(el => {
              applyVolume(el as HTMLMediaElement);
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [volume]);

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

    // FullScreen은 항상 구독 활성화 + HIGH 품질
    try {
      (pub as any)?.setSubscribed?.(true);
    } catch (e) {
      // ignore
    }

    // 품질 요청 중복 방지 플래그
    let hasRequestedHigh = false;

    const requestHighQuality = (source: string) => {
      // 이미 요청했으면 스킵 (중복 요청으로 인한 freeze 방지)
      // 🧪 테스트: HIGH → MEDIUM으로 변경하여 simulcast 레이어 문제 확인
      const TARGET_QUALITY = VideoQuality.MEDIUM; // 원래: VideoQuality.HIGH
      
      if (hasRequestedHigh && pub.videoQuality === TARGET_QUALITY) {
        console.log('[FullScreen] 이미 MEDIUM, 스킵:', { source });
        return;
      }

      const currentTrack = pub?.track;
      const beforeQuality = pub.videoQuality;
      const beforeDimensions = currentTrack?.dimensions;

      if (typeof pub.setVideoQuality === 'function') {
        pub.setVideoQuality(TARGET_QUALITY);
      } else if (typeof (pub as any).setPreferredLayer === 'function') {
        (pub as any).setPreferredLayer(TARGET_QUALITY);
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

      // 🧪 MEDIUM 테스트: 해상도도 낮춤 (1920x1080 → 1280x720)
      pub.setVideoDimensions?.({ width: 1280, height: 720 });
      hasRequestedHigh = true;

      console.log('[FullScreen] MEDIUM 품질 요청:', {
        source,
        trackSid: pub.trackSid,
        beforeQuality,
        afterQuality: pub.videoQuality,
        beforeDimensions,
        afterDimensions: currentTrack?.dimensions,
        simulcasted: pub.simulcasted,
      });
    };

    // 🧪 테스트: 품질 요청을 아예 하지 않고 SFU 자동 선택에 맡김
    // requestHighQuality('mount');
    console.log('[FullScreen] 품질 요청 비활성화 - SFU 자동 선택:', {
      currentQuality: pub.videoQuality,
      simulcasted: pub.simulcasted,
    });

    // 초기 연결 안정화를 위한 단일 retry (1초 후)
    // const retryTimeout = setTimeout(() => {
    //   if (pub.videoQuality !== VideoQuality.HIGH) {
    //     requestHighQuality('retry');
    //   }
    // }, 1000);
    const retryTimeout: ReturnType<typeof setTimeout> | null = null;

    // 🔍 비디오 크기 변경 감지 (로깅만, 재요청 안 함)
    const handleVideoDimensionsChanged = () => {
      console.log('[FullScreen] 해상도 변경됨:', {
        participant: participant.name,
        dimensions: track?.dimensions,
        videoQuality: pub.videoQuality,
        timestamp: new Date().toISOString(),
      });
    };

    // 🔍 품질 변경 감지 (로깅만)
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
        // 재구독 시에만 HIGH 재요청
        hasRequestedHigh = false;
        requestHighQuality('track-subscribed');
      }
    };

    // 이벤트 리스너 등록
    track?.on('videoDimensionsChanged', handleVideoDimensionsChanged);
    pub.on('videoQualityChanged', handleVideoQualityChanged);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

    // Cleanup: remove listeners and timers
    return () => {
      track?.off('videoDimensionsChanged', handleVideoDimensionsChanged);
      pub.off('videoQualityChanged', handleVideoQualityChanged);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      clearTimeout(retryTimeout);
    };
  }, [videoTrackRef, participant.name, room]);

  // 🔍 Freeze 디버깅을 위한 상세 모니터링 (WebRTC 통계 포함)
  useEffect(() => {
    const pub = videoTrackRef?.publication;
    const track = pub?.track;
    const remoteParticipant = videoTrackRef?.participant;
    if (!pub || !room || !remoteParticipant) return;

    // WebRTC 프레임 통계 추적
    let lastFramesReceived = 0;
    let lastFramesDecoded = 0;
    let lastFramesDropped = 0;
    let freezeCount = 0;
    let lastFreezeTime = 0;

    // 3초마다 상태 로깅 (WebRTC 통계 포함)
    const statusInterval = setInterval(async () => {
      // WebRTC 통계 가져오기
      let framesReceived = 0;
      let framesDecoded = 0;
      let framesDropped = 0;
      let jitter = 0;
      let packetsLost = 0;
      let bytesReceived = 0;
      let freezeCountDelta = 0;
      let totalFreezesDuration = 0;
      let frameWidth = 0;
      let frameHeight = 0;

      try {
        const receiver = (track as any)?.receiver;
        if (receiver) {
          const stats = await receiver.getStats();
          stats.forEach((report: any) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              framesReceived = report.framesReceived || 0;
              framesDecoded = report.framesDecoded || 0;
              framesDropped = report.framesDropped || 0;
              jitter = report.jitter || 0;
              packetsLost = report.packetsLost || 0;
              bytesReceived = report.bytesReceived || 0;
              freezeCountDelta = (report.freezeCount || 0) - freezeCount;
              freezeCount = report.freezeCount || 0;
              totalFreezesDuration = report.totalFreezesDuration || 0;
              frameWidth = report.frameWidth || 0;
              frameHeight = report.frameHeight || 0;
            }
          });
        }
      } catch (e) {
        // stats 접근 실패 시 무시
      }

      // 실제 수신 해상도
      const resolution = `${frameWidth}x${frameHeight}`;

      // 프레임 드랍/freeze 감지
      const framesDelta = framesReceived - lastFramesReceived;
      const decodedDelta = framesDecoded - lastFramesDecoded;
      const droppedDelta = framesDropped - lastFramesDropped;
      
      const qualityNames = ['LOW', 'MEDIUM', 'HIGH'];
      const connectionNames = ['unknown', 'poor', 'good', 'excellent'];

      // Freeze 감지: 3초 동안 프레임이 거의 없거나 드랍이 많으면
      const isFreezing = framesDelta < 10 || droppedDelta > 10 || freezeCountDelta > 0;
      
      if (isFreezing) {
        console.warn('[FullScreen:Monitor] ⚠️ FREEZE 감지:', {
          timestamp: new Date().toISOString(),
          framesReceived: framesDelta,
          framesDecoded: decodedDelta,
          framesDropped: droppedDelta,
          freezeCountDelta,
          totalFreezesDuration: totalFreezesDuration.toFixed(2) + 's',
          jitter: (jitter * 1000).toFixed(1) + 'ms',
          packetsLost,
        });
      }
      
      console.log('[FullScreen:Monitor] 📊 상태:', {
        timestamp: new Date().toISOString(),
        // Track 상태
        trackSid: pub.trackSid,
        subscribed: pub.subscribed,
        videoQuality: qualityNames[pub.videoQuality] || pub.videoQuality,
        isMuted: pub.isMuted,
        // 실제 수신 해상도
        resolution,
        // 연결 상태
        connectionQuality: connectionNames[remoteParticipant.connectionQuality] || remoteParticipant.connectionQuality,
        roomState: room.state,
        // WebRTC 프레임 통계 (3초간)
        framesReceived: framesDelta,
        framesDecoded: decodedDelta, 
        framesDropped: droppedDelta,
        expectedFps: (framesDelta / 3).toFixed(1),
        // 네트워크 품질
        jitter: (jitter * 1000).toFixed(1) + 'ms',
        packetsLost,
        kbps: ((bytesReceived - (lastFramesReceived > 0 ? bytesReceived : 0)) * 8 / 3000).toFixed(0),
      });

      lastFramesReceived = framesReceived;
      lastFramesDecoded = framesDecoded;
      lastFramesDropped = framesDropped;
    }, 3000);

    // 🔴 Mute 상태 변경 (freeze 원인 가능)
    const handleMuted = () => {
      console.warn('[FullScreen:Monitor] ⚠️ 트랙 MUTED:', {
        timestamp: new Date().toISOString(),
        trackSid: pub.trackSid,
        isMuted: pub.isMuted,
      });
    };

    const handleUnmuted = () => {
      console.log('[FullScreen:Monitor] ✅ 트랙 UNMUTED:', {
        timestamp: new Date().toISOString(),
        trackSid: pub.trackSid,
      });
    };

    // 🔴 구독 상태 변경
    const handleSubscriptionStatusChanged = () => {
      console.warn('[FullScreen:Monitor] 🔄 구독 상태 변경:', {
        timestamp: new Date().toISOString(),
        trackSid: pub.trackSid,
        subscribed: pub.subscribed,
        subscriptionStatus: pub.subscriptionStatus,
      });
    };

    // 🔴 연결 품질 변경 (네트워크 문제)
    const handleConnectionQualityChanged = (quality: ConnectionQuality) => {
      const qualityNames = ['unknown', 'poor', 'good', 'excellent'];
      console.log('[FullScreen:Monitor] 📶 연결 품질 변경:', {
        timestamp: new Date().toISOString(),
        participant: participant.name,
        quality: qualityNames[quality] || quality,
      });
      if (quality <= 1) { // poor or unknown
        console.warn('[FullScreen:Monitor] ⚠️ 네트워크 품질 저하!');
      }
    };

    // 🔴 트랙 ended (스트림 종료)
    const handleEnded = () => {
      console.error('[FullScreen:Monitor] ❌ 트랙 ENDED:', {
        timestamp: new Date().toISOString(),
        trackSid: pub.trackSid,
      });
    };

    // 🔴 Room 재연결
    const handleReconnecting = () => {
      console.warn('[FullScreen:Monitor] 🔄 Room 재연결 중...', {
        timestamp: new Date().toISOString(),
      });
    };

    const handleReconnected = () => {
      console.log('[FullScreen:Monitor] ✅ Room 재연결 완료', {
        timestamp: new Date().toISOString(),
      });
    };

    // 이벤트 리스너 등록
    pub.on('muted', handleMuted);
    pub.on('unmuted', handleUnmuted);
    pub.on('subscriptionStatusChanged', handleSubscriptionStatusChanged);
    track?.on('ended', handleEnded);
    remoteParticipant.on('connectionQualityChanged', handleConnectionQualityChanged);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);

    return () => {
      clearInterval(statusInterval);
      pub.off('muted', handleMuted);
      pub.off('unmuted', handleUnmuted);
      pub.off('subscriptionStatusChanged', handleSubscriptionStatusChanged);
      track?.off('ended', handleEnded);
      remoteParticipant.off('connectionQualityChanged', handleConnectionQualityChanged);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
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
          right: '420px',
          top: isHeaderHidden ? 0 : 'var(--header-height, 64px)',
          zIndex: 65,
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
              boxShadow: isAlert
                ? `0 0 0 4px ${colors.border}, 0 0 40px ${colors.glow}, 0 40px 100px rgba(0, 0, 0, 0.6)`
                : '0 40px 100px rgba(0, 0, 0, 0.6)',
              background: '#000000',
              height: '90vh',
              aspectRatio: '9 / 16', // Maintains portrait aspect ratio
              animation: isAlert
                ? `${effectiveRiskLevel}Pulse 1.5s ease-in-out infinite`
                : undefined,
            }}
          >
            {isAlert && (
              <style>
                {`
                  @keyframes criticalPulse {
                    0%, 100% { box-shadow: 0 0 0 4px #ef4444, 0 0 40px rgba(239, 68, 68, 0.6), 0 40px 100px rgba(0, 0, 0, 0.6); }
                    50% { box-shadow: 0 0 0 6px #ef4444, 0 0 60px rgba(239, 68, 68, 0.8), 0 40px 100px rgba(0, 0, 0, 0.6); }
                  }
                  @keyframes cautionPulse {
                    0%, 100% { box-shadow: 0 0 0 4px #eab308, 0 0 40px rgba(234, 179, 8, 0.6), 0 40px 100px rgba(0, 0, 0, 0.6); }
                    50% { box-shadow: 0 0 0 6px #eab308, 0 0 60px rgba(234, 179, 8, 0.8), 0 40px 100px rgba(0, 0, 0, 0.6); }
                  }
                `}
              </style>
            )}
            {videoTrackRef ? (
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
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#1a1a1a',
                  color: '#666',
                  fontSize: '14px',
                }}
              >
                비디오 로딩 중...
              </div>
            )}
          </div>

          {/* Participant Name Label and Volume Control */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              right: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Participant Name */}
            <div
              style={{
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
                  background: colors.dot,
                  animation: isAlert
                    ? 'pulse 1s ease-in-out infinite'
                    : undefined,
                }}
              />
              {participant.name}
            </div>

            {/* Volume Control */}
            <div
              ref={volumeControlRef}
              style={{
                position: 'relative',
              }}
            >
              {/* Volume Slider Popup - Vertical */}
              {showVolumeSlider && (
                <div
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '120px',
                    height: '32px',
                  }}
                >
                  <div
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center center',
                      width: '120px',
                    }}
                  >
                    <Slider
                      value={volume}
                      onChange={setVolume}
                      min={0}
                      max={100}
                      step={1}
                      aria-label="Volume"
                    />
                  </div>
                </div>
              )}

              {/* Volume Button */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowVolumeSlider(!showVolumeSlider);
                }}
                onMouseDown={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                style={{
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                }}
                aria-label="Volume control"
              >
                {volume === 0 ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : volume < 50 ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
