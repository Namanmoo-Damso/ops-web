import { useEffect, useState, useRef } from 'react';
import {
  TrackRefContext,
  VideoTrack,
  useRoomContext,
} from '@livekit/components-react';
import { VideoQuality, RoomEvent, Track } from 'livekit-client';
import type { MockParticipant } from './ParticipantSidebar';
import Slider from '../ui/Slider';

type FullScreenVideoProps = {
  participant: MockParticipant;
  videoTrackRef: any;
  isDanger?: boolean;
  isHeaderHidden?: boolean;
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
  isHeaderHidden = false,
}: FullScreenVideoProps) => {
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
        setTimeout(() => requestHighQuality(`retry-${i + 1}`), delay),
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
              boxShadow: isDanger
                ? '0 0 0 4px #ef4444, 0 0 40px rgba(239, 68, 68, 0.6), 0 40px 100px rgba(0, 0, 0, 0.6)'
                : '0 40px 100px rgba(0, 0, 0, 0.6)',
              background: '#000000',
              height: '90vh',
              aspectRatio: '9 / 16', // Maintains portrait aspect ratio
              animation: isDanger
                ? 'dangerPulse 1.5s ease-in-out infinite'
                : undefined,
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
                  background: isDanger ? '#ef4444' : '#10b981',
                  animation: isDanger
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
