import {
  MonitorPlay,
  User,
  Phone,
  AlertTriangle,
  PhoneCall,
  AlertOctagon,
} from 'lucide-react';
import { ReactNode, useEffect, useRef, useState, JSX } from 'react';
import type { MockParticipant } from './ParticipantSidebar';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';
import { IconButton } from '../ui';
import DetailModal from '../../app/beneficiaries/DetailModal';
import type { BeneficiarySummary } from '../../types/models';
import type { BeneficiaryDetail } from '../../app/beneficiaries/DetailModal';

type ParticipantDetailSidebarProps = {
  participant: MockParticipant;
  onClose: () => void;
  roomName?: string;
  apiBase?: string;
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

// Helper function to highlight danger keywords
const highlightDangerKeywords = (text: string) => {
  const dangerKeywords = [
    '도와주세요',
    '살려주세요',
    '아파',
    '고통',
    '숨',
    '쓰러',
    '넘어',
    '위험',
    '응급',
    '119',
    '112',
    '사고',
    '출혈',
    '의식',
    '어지러',
    '가슴',
    '통증',
    '두통',
    '호흡',
    '심장',
    '약',
    '먹었',
    '삼켰',
  ];

  let highlightedText: (string | JSX.Element)[] = [text];

  dangerKeywords.forEach(keyword => {
    const newHighlightedText: (string | JSX.Element)[] = [];

    highlightedText.forEach(part => {
      if (typeof part === 'string') {
        const parts = part.split(new RegExp(`(${keyword})`, 'gi'));
        parts.forEach((p, i) => {
          if (p.toLowerCase().includes(keyword.toLowerCase())) {
            newHighlightedText.push(
              <span
                key={`${keyword}-${i}`}
                style={{
                  background: '#fecaca',
                  color: '#dc2626',
                  fontWeight: 700,
                  padding: '2px 4px',
                  borderRadius: '4px',
                }}
              >
                {p}
              </span>,
            );
          } else if (p) {
            newHighlightedText.push(p);
          }
        });
      } else {
        newHighlightedText.push(part);
      }
    });

    highlightedText = newHighlightedText;
  });

  return <>{highlightedText}</>;
};

export const ParticipantDetailSidebar = ({
  participant,
  onClose,
  roomName,
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
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

  // DetailModal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [beneficiaryDetail, setBeneficiaryDetail] =
    useState<BeneficiaryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
          width: 'min(420px, 90vw)',
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
            background: 'transparent',
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
          {/* Emergency Status Alert - only shown when danger is detected */}
          {isDanger && (
            <div
              style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                border: '2px solid #ef4444',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
                animation: 'emergencyPulse 2s ease-in-out infinite',
              }}
            >
              <style>
                {`
                  @keyframes emergencyPulse {
                    0%, 100% { box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3); }
                    50% { box-shadow: 0 12px 32px rgba(239, 68, 68, 0.5); }
                  }
                `}
              </style>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <AlertOctagon size={28} color="#dc2626" strokeWidth={2.5} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#dc2626',
                      marginBottom: '6px',
                    }}
                  >
                    위급 상황 감지됨
                  </div>
                  <div style={{ fontSize: '15px', color: '#991b1b' }}>
                    대화 내용 및 분석 결과를 확인하고 즉시 대응하세요
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Level Indicator - always shown */}
          {!isDanger && (
            <div
              style={{
                background: isWarning
                  ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                  : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                border: `2px solid ${isWarning ? '#f59e0b' : '#10b981'}`,
                borderRadius: '16px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: isWarning ? '#f59e0b' : '#10b981',
                  boxShadow: isWarning
                    ? '0 0 12px rgba(245, 158, 11, 0.6)'
                    : '0 0 12px rgba(16, 185, 129, 0.6)',
                }}
              />
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: isWarning ? '#92400e' : '#065f46',
                  }}
                >
                  {isWarning ? '주의 필요' : '정상 상태'}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: isWarning ? '#b45309' : '#047857',
                    marginLeft: '8px',
                  }}
                >
                  실시간 모니터링 중
                </span>
              </div>
            </div>
          )}

          {/* 1. Name Card (Compact) */}
          <InfoCard
            icon={<User size={20} />}
            label="대상자 정보"
            color={accentColor}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {/* Name and Age - horizontal alignment */}
              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#4A5D23',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {participant.name}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                  }}
                >
                  82세
                </span>

                {/* Detail Button - aligned horizontally with name */}
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#4A5D23',
                    color: '#ffffff',
                    fontSize: '17px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: loadingDetail ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    marginLeft: '20px',
                    opacity: loadingDetail ? 0.6 : 1,
                  }}
                  onMouseOver={e => {
                    if (!loadingDetail) {
                      e.currentTarget.style.background = '#3a4d1a';
                    }
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#4A5D23';
                  }}
                  onClick={async () => {
                    if (loadingDetail) return;

                    // Use beneficiaryId if available, otherwise use participant.id as fallback
                    const idToUse = participant.beneficiaryId || participant.id;
                    console.log('[DetailButton] Opening detail for:', {
                      participantId: participant.id,
                      participantName: participant.name,
                      beneficiaryId: participant.beneficiaryId,
                      idToUse,
                    });

                    setLoadingDetail(true);
                    try {
                      // Fetch beneficiary detail
                      const url = `${apiBase}/api/beneficiaries/${idToUse}`;
                      console.log('[DetailButton] Fetching from:', url);
                      const response = await fetch(url);

                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error(
                          '[DetailButton] API Error:',
                          response.status,
                          errorText,
                        );
                        throw new Error(
                          `Failed to fetch beneficiary detail: ${response.status}`,
                        );
                      }

                      const data = await response.json();
                      console.log('[DetailButton] Received data:', data);
                      setBeneficiaryDetail(data);
                      setShowDetailModal(true);
                    } catch (error) {
                      console.error(
                        '[DetailButton] Failed to load beneficiary detail:',
                        error,
                      );
                      alert(
                        `대상자 정보를 불러오는데 실패했습니다.\n\nParticipant ID: ${participant.id}\nBeneficiary ID: ${participant.beneficiaryId || 'N/A'}\n\n${error instanceof Error ? error.message : String(error)}`,
                      );
                    } finally {
                      setLoadingDetail(false);
                    }
                  }}
                >
                  {loadingDetail ? '로딩 중...' : '상세정보'}
                </button>
              </div>
            </div>
          </InfoCard>

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
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#64748b',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
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
                  maxHeight: '500px',
                  minHeight: '400px',
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
                            fontSize: '15px',
                            lineHeight: '1.6',
                            boxShadow: isAgent
                              ? '0 2px 4px rgba(0,0,0,0.02)'
                              : '0 2px 4px rgba(74,93,35,0.2)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '12px',
                              marginBottom: '4px',
                              color: isAgent
                                ? 'rgba(100,116,139,0.8)'
                                : 'rgba(255,255,255,0.8)',
                              fontWeight: 600,
                            }}
                          >
                            {isAgent ? 'AI Caregiver' : 'Patient'}
                          </div>
                          {/* Highlight danger keywords in text */}
                          {highlightDangerKeywords(t.text)}
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

        {/* Footer with Emergency Actions */}
        <div
          style={{
            padding: '20px 24px 24px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background:
              'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.5) 100%)',
            borderTop: '1px solid rgba(226,232,240,0.8)',
          }}
        >
          {/* Emergency Call Button - Primary action */}
          <button
            style={{
              width: '100%',
              background: isTakeoverActive
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : isDanger
                  ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontWeight: 800,
              padding: '18px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '17px',
              transition: 'all 0.2s',
              boxShadow: isDanger
                ? '0 8px 24px rgba(220, 38, 38, 0.4)'
                : '0 4px 12px rgba(239, 68, 68, 0.3)',
              animation: isDanger
                ? 'buttonPulse 2s ease-in-out infinite'
                : undefined,
            }}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.navigator.vibrate?.(200);
              }
              onToggleTakeover?.();
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isDanger
                ? '0 12px 32px rgba(220, 38, 38, 0.5)'
                : '0 8px 20px rgba(239, 68, 68, 0.4)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDanger
                ? '0 8px 24px rgba(220, 38, 38, 0.4)'
                : '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
          >
            <style>
              {`
                @keyframes buttonPulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.02); }
                }
              `}
            </style>
            <Phone size={22} strokeWidth={2.5} />
            {isTakeoverActive ? '통화 종료' : '긴급 통화 개입'}
          </button>

          {/* Emergency Services Buttons - Grid layout */}
          {isDanger && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <button
                style={{
                  background:
                    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '14px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                }}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.navigator.vibrate?.(100);
                  }
                  // TODO: Call 119
                  window.open('tel:119');
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(245, 158, 11, 0.4)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(245, 158, 11, 0.3)';
                }}
              >
                <AlertOctagon size={20} strokeWidth={2.5} />
                <span>119 신고</span>
              </button>

              <button
                style={{
                  background:
                    'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '14px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
                }}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.navigator.vibrate?.(100);
                  }
                  // TODO: Call 112
                  window.open('tel:112');
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(8, 145, 178, 0.4)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(8, 145, 178, 0.3)';
                }}
              >
                <AlertOctagon size={20} strokeWidth={2.5} />
                <span>112 신고</span>
              </button>
            </div>
          )}

          {/* Clear Danger Button */}
          {isDanger && (
            <button
              style={{
                width: '100%',
                background: 'transparent',
                color: '#64748b',
                fontWeight: 600,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(148,163,184,0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.navigator.vibrate?.(10);
                }
                onClearDanger?.();
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(148,163,184,0.1)';
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.5)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
              }}
            >
              <AlertTriangle size={16} />
              위험 상태 해제
            </button>
          )}

          {/* Status text */}
          {!isDanger && (
            <p
              style={{
                fontSize: '13px',
                textAlign: 'center',
                color: '#94a3b8',
                marginTop: '4px',
                fontWeight: 600,
              }}
            >
              {isTakeoverActive
                ? '현재 통화 개입 중입니다'
                : '긴급 상황 발생 시 즉시 대응 가능'}
            </p>
          )}
        </div>
      </div>

      {/* DetailModal */}
      {showDetailModal && beneficiaryDetail && (
        <DetailModal
          beneficiary={
            {
              id: participant.beneficiaryId || participant.id,
              name: participant.name,
              status: participant.status,
              lastContact: participant.lastSeen || new Date().toISOString(),
            } as BeneficiarySummary
          }
          detail={beneficiaryDetail}
          onClose={() => {
            setShowDetailModal(false);
            setBeneficiaryDetail(null);
          }}
          onUpdate={async payload => {
            try {
              const response = await fetch(
                `${apiBase}/api/beneficiaries/${participant.beneficiaryId}`,
                {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                },
              );

              if (!response.ok) throw new Error('Update failed');

              const updated = await response.json();
              setBeneficiaryDetail(updated);
              return updated;
            } catch (error) {
              console.error('Failed to update beneficiary:', error);
              return null;
            }
          }}
        />
      )}
    </>
  );
};
