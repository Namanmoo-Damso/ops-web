import {
  X,
  MonitorPlay,
  User,
  Stethoscope,
  Pill,
  Contact,
  MessageCircle,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import type { MockParticipant } from './ParticipantSidebar';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';
import { IconButton } from '../ui';

type ParticipantDetailSidebarProps = {
  participant: MockParticipant;
  onClose: () => void;
  roomName?: string;
  isTakeoverActive?: boolean;
  onToggleTakeover?: () => void;
  isDanger?: boolean;
  onClearDanger?: () => void;
};

type Transcript = {
  role: 'agent' | 'user';
  text: string;
  timestamp: number;
};

const hexToRgba = (hex: string, alpha = 1) => {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) return hex;

  const numeric = Number.parseInt(sanitized, 16);
  if (Number.isNaN(numeric)) return hex;

  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const InfoCard = ({
  icon,
  label,
  children,
  highlight = false,
  color = '#38bdf8',
  rightSlot,
}: {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
  highlight?: boolean;
  color?: string;
  rightSlot?: ReactNode;
}) => {
  return (
    <div
      style={{
        position: 'relative',
        background: '#ffffff',
        border: `1px solid ${
          highlight ? hexToRgba(color, 0.45) : 'rgba(226,232,240,1)'
        }`,
        borderRadius: '18px',
        padding: '14px 20px',
        boxShadow: highlight
          ? `0 25px 45px ${hexToRgba(color, 0.25)}`
          : '0 18px 38px rgba(15,23,42,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {icon ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4A5D23',
              }}
            >
              {icon}
            </span>
          ) : null}
          <span
            style={{
              fontSize: '14px',
              letterSpacing: '0.05em',
              textTransform: 'none',
              fontWeight: 700,
              color: '#4A5D23',
            }}
          >
            {label}
          </span>
        </div>
        {rightSlot ? (
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {rightSlot}
          </div>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
};

export const ParticipantDetailSidebar = ({
  participant,
  onClose,
  roomName,
  isTakeoverActive = false,
  onToggleTakeover,
  isDanger = false,
  onClearDanger,
}: ParticipantDetailSidebarProps) => {
  const isWarning = participant.status === 'WARNING';
  const accentColor = isWarning ? '#f87171' : '#38bdf8';
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const room = useRoomContext();

  // Listen for real-time transcripts via data packets
  useEffect(() => {
    console.log('[Sidebar] Room context:', room);
    console.log('[Sidebar] Room state:', room?.state);
    console.log('[Sidebar] Room name:', room?.name);

    if (!room) {
      console.log('[Sidebar] No room context available');
      return;
    }

    console.log(
      '[Sidebar] Setting up DataReceived listener for room:',
      room.name,
    );

    const handleData = (
      payload: Uint8Array,
      participant?: any,
      kind?: DataPacket_Kind,
    ) => {
      try {
        const strData = new TextDecoder().decode(payload);
        console.log(
          '[Sidebar] Received data:',
          strData,
          'kind:',
          kind,
          'participant:',
          participant?.identity,
        );
        const data = JSON.parse(strData);

        if (data.type === 'transcript') {
          console.log('[Sidebar] Processing transcript:', data);
          setTranscripts(prev => [
            ...prev,
            {
              role: data.role,
              text: data.text,
              timestamp: data.timestamp || Date.now(),
            },
          ]);
        }
      } catch (e) {
        console.error('[Sidebar] Failed to parse data packet:', e);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  return (
    <>
      {/* Backdrop - Clickable overlay without visual blur */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          transition: 'opacity 300ms',
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
        onClick={onClose}
      />

      {/* Floating Sidebar */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 'min(520px, 100%)',
          background: 'linear-gradient(180deg, #F7F9F2 0%, #F0F5E8 70%)',
          borderLeft: '1px solid rgba(148,163,184,0.35)',
          zIndex: 70,
          color: '#4A5D23',
          boxShadow: '-40px 0 80px rgba(15, 23, 42, 0.15)',
          height: '100vh',
          overflow: 'hidden',
        }}
        className="flex flex-col"
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px 18px 32px',
            background: '#ffffff',
            borderBottom: '1px solid rgba(226,232,240,1)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              <MonitorPlay size={26} strokeWidth={2.4} color="#4A5D23" />
              <h3
                style={{
                  fontWeight: 800,
                  fontSize: '20px',
                  color: '#4A5D23',
                }}
              >
                세부 모니터링
              </h3>
            </div>
            <IconButton
              variant="close"
              onClick={onClose}
              aria-label="닫기"
              style={{
                background: '#F7F9F2',
                border: '1px solid rgba(203,213,225,1)',
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            padding: '24px 32px 32px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overscrollBehavior: 'contain',
          }}
        >
          {/* 1. Name Card (Compact) */}
          <InfoCard
            icon={<User size={18} />}
            label="환자 정보"
            color={accentColor}
          >
            <div className="flex items-center gap-4 flex-wrap">
              {/* Name */}
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#4A5D23',
                  whiteSpace: 'nowrap',
                  paddingRight: '12px',
                }}
              >
                {participant.name}
              </span>

              {/* Age / Care */}
              <span
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                }}
              >
                82세 · 정기 케어
              </span>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isWarning ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: accentColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isWarning ? '위험 감지됨' : '안전 상태'}
                </span>
              </div>
            </div>
          </InfoCard>

          <div
            style={{
              height: '1px',
              width: '100%',
              background:
                'linear-gradient(90deg, transparent, rgba(148,163,184,0.4), transparent)',
              margin: '4px 0 8px',
            }}
          />

          <InfoCard
            icon={<Stethoscope size={18} />}
            label="기저질환"
            color="#60a5fa"
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div className="flex flex-wrap gap-2">
                {['고혈압', '협심증'].map(disease => (
                  <span
                    key={disease}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: 'rgba(37,99,235,0.08)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#8FA963',
                    }}
                  >
                    {disease}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                정기적인 모니터링 필요
              </span>
            </div>
          </InfoCard>

          <InfoCard icon={<Pill size={18} />} label="복약 정보" color="#a855f7">
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#4A5D23',
                }}
              >
                아침 8시 · 저녁 8시
              </div>
              <div style={{ fontSize: '13px', color: '#7c3aed' }}>
                담당: 김의진 (평촌탑병원)
              </div>
            </div>
          </InfoCard>

          <div
            style={{
              height: '1px',
              width: '100%',
              background:
                'linear-gradient(90deg, transparent, rgba(148,163,184,0.4), transparent)',
            }}
          />

          <InfoCard
            label="실시간 대화"
            color="#06b6d4"
            rightSlot={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748b',
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
                  실시간 녹음 중
                </span>
              </div>
            }
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div
                style={{
                  background: '#F7F9F2',
                  borderRadius: '16px',
                  border: '1px solid rgba(226,232,240,1)',
                  padding: '14px',
                  maxHeight: '210px',
                  overflowY: 'auto',
                  boxShadow: 'inset 0 1px 6px rgba(15,23,42,0.05)',
                }}
              >
                <div className="flex flex-col gap-4">
                  {transcripts.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-4">
                      대화 내역이 없습니다.
                    </div>
                  ) : (
                    transcripts.map((t, i) => {
                      const isAgent = t.role === 'agent';
                      return (
                        <div
                          key={i}
                          style={{
                            alignSelf: isAgent ? 'flex-start' : 'flex-end',
                            maxWidth: '85%',
                            padding: '10px 14px',
                            borderRadius: '16px',
                            borderBottomLeftRadius: isAgent ? '2px' : '16px',
                            borderBottomRightRadius: isAgent ? '16px' : '2px',
                            background: isAgent ? '#ffffff' : '#4A5D23',
                            color: isAgent ? '#1e293b' : '#ffffff',
                            border: isAgent
                              ? '1px solid rgba(226,232,240,1)'
                              : 'none',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            boxShadow: isAgent
                              ? '0 2px 4px rgba(0,0,0,0.02)'
                              : '0 2px 4px rgba(74,93,35,0.2)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '10px',
                              marginBottom: '4px',
                              color: isAgent
                                ? 'rgba(100,116,139,0.8)'
                                : 'rgba(255,255,255,0.8)',
                              fontWeight: 600,
                            }}
                          >
                            {isAgent ? 'AI Caregiver' : 'Patient'}
                          </div>
                          {t.text}
                        </div>
                      );
                    })
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Footer with Takeover Button */}
        <div
          style={{
            padding: '20px 32px 28px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Clear Danger Button - only shown when danger is active */}
          {isDanger && (
            <button
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 70%)',
                color: '#ffffff',
                fontWeight: 800,
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '15px',
                transition: 'all 0.2s',
              }}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.navigator.vibrate?.(10);
                }
                onClearDanger?.();
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <AlertTriangle size={20} />
              위험 상태 해제
            </button>
          )}

          <button
            style={{
              width: '100%',
              background: isTakeoverActive
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 70%)'
                : 'linear-gradient(135deg, #fb7185 0%, #f43f5e 70%)',
              color: '#ffffff',
              fontWeight: 800,
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px',
              transition: 'all 0.2s',
            }}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.navigator.vibrate?.(10);
              }
              onToggleTakeover?.();
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Phone size={20} />
            {isTakeoverActive ? '긴급 통화 종료' : '긴급 통화 개입 (Takeover)'}
          </button>
          <p
            style={{
              fontSize: '11px',
              textAlign: 'center',
              color: '#94a3b8',
              marginTop: '4px',
              fontWeight: 600,
            }}
          >
            {isTakeoverActive
              ? '현재 통화 개입 중입니다'
              : '관리자 권한으로 즉시 개입 가능'}
          </p>
        </div>
      </div>
    </>
  );
};
