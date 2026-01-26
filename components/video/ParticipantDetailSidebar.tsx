import {
  MonitorPlay,
  User,
  Phone,
  AlertTriangle,
  PhoneCall,
  AlertOctagon,
} from 'lucide-react';
import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  JSX,
} from 'react';
import type { MockParticipant } from './ParticipantSidebar';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';
import { IconButton } from '../ui';
import DetailModal from '../../app/beneficiaries/DetailModal';
import type { BeneficiarySummary } from '../../types/models';
import type { BeneficiaryDetail } from '../../app/beneficiaries/DetailModal';
import { API_BASE } from '../../lib/api-client';

type ParticipantDetailSidebarProps = {
  participant: MockParticipant;
  onClose: () => void;
  roomName?: string;
  apiBase?: string;
  isTakeoverActive?: boolean;
  onToggleTakeover?: () => void;
  isDanger?: boolean;
  riskLevel?: 'normal' | 'caution' | 'critical';
  dangerCode?: string; // 4-bit: 1000=deviceFall, 0100=personFall, 0010=loudVoice, 0001=emotion
  onClearDanger?: () => void;
  detectionInfo?: DetectionInfo | null;
  isHeaderHidden?: boolean;
};

type Transcript = {
  role: 'agent' | 'user';
  text: string;
  timestamp: number;
};

type DetectionCriteria = {
  name: string;
  value: string;
  level: 'low' | 'medium' | 'high';
};

type DetectionInfo = {
  type: string;
  severity: string;
  criteria: DetectionCriteria[];
};

// 센서 상태 타입
type SensorStatusLevel = 'normal' | 'caution' | 'critical';

type SensorState = {
  status: SensorStatusLevel;
  value: number; // 0-100 퍼센트 값
  lastUpdated: number;
  isLocked: boolean; // 주의/경고 시 값 고정
  pendingValue?: number; // 잠금 상태에서 들어온 최신 값 (해제 시 적용)
};

type SensorStates = {
  emotion: SensorState;
  audio: SensorState;
  motion: SensorState;
  face: SensorState;
};

// sensor_status 토픽으로 수신되는 메시지 타입
type SensorStatusMessage = {
  timestamp: number;
  wardId: string;
  emotion?: {
    status: SensorStatusLevel;
    value: string;
    confidence: number;
  };
  audio?: {
    status: SensorStatusLevel;
    level: number;
    decibel: number;
  };
  motion?: {
    status: SensorStatusLevel;
    fallRisk: number;
    isFreefalling: boolean;
  };
  face?: {
    status: SensorStatusLevel;
    isDetected: boolean;
    faceY: number;
  };
};

const SENSOR_LABELS: Record<keyof SensorStates, string> = {
  emotion: '감정',
  audio: '음성',
  motion: '모션',
  face: '얼굴',
};

// alertType → sensor 매핑
const ALERT_TYPE_TO_SENSOR: Record<string, keyof SensorStates> = {
  emotion: 'emotion',
  device_fall: 'motion',
  person_fall: 'face',
  loud_voice: 'audio',
};

// 상태별 색상
const SENSOR_STATUS_COLORS: Record<SensorStatusLevel, { dot: string; border: string; bg: string }> = {
  normal: { dot: '#22c55e', border: '#e2e8f0', bg: '#ffffff' },
  caution: { dot: '#eab308', border: '#eab308', bg: '#fefce8' },
  critical: { dot: '#ef4444', border: '#ef4444', bg: '#fef2f2' },
};

// 센서 상태 표시 컴포넌트 (가로 막대그래프)
const SensorStatusIndicator = ({
  states,
  onUnlock,
}: {
  states: SensorStates;
  onUnlock?: (sensor: keyof SensorStates) => void;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '14px 16px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {(Object.keys(states) as Array<keyof SensorStates>).map((sensor) => {
        const state = states[sensor];
        const colors = SENSOR_STATUS_COLORS[state.status];
        const isAlert = state.status !== 'normal';

        return (
          <div
            key={sensor}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* 센서 라벨 */}
            <span
              style={{
                width: '48px',
                fontSize: '12px',
                fontWeight: 600,
                color: isAlert ? colors.dot : '#64748b',
                flexShrink: 0,
              }}
            >
  {SENSOR_LABELS[sensor]}
            </span>

            {/* 막대그래프 컨테이너 */}
            <div
              style={{
                flex: 1,
                height: '20px',
                background: '#f1f5f9',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
                border: isAlert ? `1.5px solid ${colors.border}` : '1px solid #e2e8f0',
              }}
            >
              {/* 막대 (값) */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${state.value}%`,
                  background: isAlert
                    ? `linear-gradient(90deg, ${colors.dot}cc, ${colors.dot})`
                    : 'linear-gradient(90deg, #22c55e99, #22c55e)',
                  borderRadius: '10px',
                  transition: state.isLocked ? 'none' : 'width 0.3s ease',
                  animation: isAlert && state.status === 'critical' ? 'bar-pulse 1.5s infinite' : undefined,
                }}
              />
              {/* 퍼센트 텍스트 */}
              <span
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: state.value > 60 ? '#ffffff' : '#475569',
                  textShadow: state.value > 60 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {Math.round(state.value)}%
              </span>
            </div>

            {/* 잠금 상태 표시 및 해제 버튼 */}
            {state.isLocked ? (
              <button
                onClick={() => onUnlock?.(sensor)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: colors.dot,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                해제
              </button>
            ) : (
              <div style={{ width: '40px', flexShrink: 0 }} /> // 공간 유지
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes bar-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
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
        border: `1px solid ${highlight ? hexToRgba(color, 0.45) : 'rgba(226,232,240,1)'
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

// Helper function to highlight danger keywords (Agent 감지 키워드만 사용 - 단일 소스)
const highlightDangerKeywords = (text: string, detectedKeywords: string[] = []) => {
  // Agent에서 감지한 키워드만 사용 (baseKeywords 제거 - 단일 소스 관리)
  const dangerKeywords = detectedKeywords;

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

// Alert type labels in Korean
const ALERT_TYPE_LABELS: Record<string, string> = {
  device_fall: '기기 낙상',
  person_fall: '낙상',
  loud_voice: '큰 소리/비명',
  emotion: '감정 분석',
  speech_keyword: '키워드 감지',
};

// Detection value labels in Korean (for criteria display)
const DETECTION_VALUE_LABELS: Record<string, string> = {
  // DeviceFallType
  freefall_impact: '자유낙하 충격',
  impact: '충격',
  rotation_impact: '회전 충격',
  combination: '복합',
  // PersonFallType
  rapid_descent: '급격한 하강',
  face_disappeared: '얼굴 사라짐',
  size_change: '크기 변화',
  // EmotionType
  neutral: '중립',
  happy: '행복',
  sad: '슬픔',
  angry: '분노',
  fearful: '공포',
  disgusted: '혐오',
  surprised: '놀람',
};

// Severity labels in Korean
const SEVERITY_LABELS: Record<string, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  critical: '심각',
};

// Level color mapping
const LEVEL_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  low: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  medium: { bg: '#fed7aa', text: '#9a3412', border: '#fdba74' },
  high: { bg: '#fecaca', text: '#dc2626', border: '#f87171' },
};

// Convert 4-bit danger code to DetectionInfo
// Format: 1000=deviceFall, 0100=personFall, 0010=loudVoice, 0001=emotion
const dangerCodeToDetectionInfo = (dangerCode: string): DetectionInfo | null => {
  if (!dangerCode || dangerCode === '0000') return null;

  // Parse the 4-bit code
  const deviceFall = dangerCode[0] === '1';
  const personFall = dangerCode[1] === '1';
  const loudVoice = dangerCode[2] === '1';
  const emotion = dangerCode[3] === '1';

  // Determine primary alert type (priority: personFall > deviceFall > loudVoice > emotion)
  let type = 'unknown';
  let severity = 'high';

  if (personFall) {
    type = 'person_fall';
    severity = 'critical';
  } else if (deviceFall) {
    type = 'device_fall';
    severity = 'high';
  } else if (loudVoice) {
    type = 'loud_voice';
    severity = 'high';
  } else if (emotion) {
    type = 'emotion';
    severity = 'medium';
  }

  // Build criteria list based on active flags
  const criteria: DetectionCriteria[] = [];

  if (deviceFall) {
    criteria.push({
      name: '감지 유형',
      value: 'impact',
      level: 'high',
    });
  }

  if (personFall) {
    criteria.push({
      name: '감지 유형',
      value: 'face_disappeared',
      level: 'high',
    });
  }

  if (loudVoice) {
    criteria.push({
      name: '음성 상태',
      value: '큰 소리 감지',
      level: 'high',
    });
  }

  if (emotion) {
    criteria.push({
      name: '감정 상태',
      value: '부정적 감정',
      level: 'medium',
    });
  }

  return {
    type,
    severity,
    criteria,
  };
};

// Border colors based on risk level
const SIDEBAR_BORDER_COLORS = {
  normal: 'rgba(148,163,184,0.35)',
  caution: '#eab308',
  critical: '#ef4444',
};

export const ParticipantDetailSidebar = ({
  participant,
  onClose,
  roomName,
  apiBase,
  isTakeoverActive = false,
  onToggleTakeover,
  isDanger = false,
  riskLevel = 'normal',
  dangerCode,
  onClearDanger,
  detectionInfo,
  isHeaderHidden = false,
}: ParticipantDetailSidebarProps) => {
  const isWarning = participant.status === 'WARNING';
  const accentColor = isWarning ? '#f87171' : '#38bdf8';

  // Determine effective risk level for sidebar border
  const effectiveRiskLevel = riskLevel !== 'normal' ? riskLevel : (isDanger ? 'critical' : 'normal');
  const sidebarBorderColor = SIDEBAR_BORDER_COLORS[effectiveRiskLevel];
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for chat scroll container
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const room = useRoomContext();

  // DetailModal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [beneficiaryDetail, setBeneficiaryDetail] =
    useState<BeneficiaryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Detection info from DataChannel (agent alert_response)
  const [localDetectionInfo, setLocalDetectionInfo] =
    useState<DetectionInfo | null>(null);

  // 센서 상태 (4개 센서)
  const initialSensorState: SensorState = {
    status: 'normal',
    value: 0,
    lastUpdated: Date.now(),
    isLocked: false,
  };
  const [sensorStates, setSensorStates] = useState<SensorStates>({
    emotion: initialSensorState,
    audio: initialSensorState,
    motion: initialSensorState,
    face: initialSensorState,
  });

  // Agent에서 감지한 동적 키워드 리스트 (하이라이트용)
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);

  // 키워드 감지 시 카테고리 라벨 (예: "두통", "복통", "우울감")
  const [keywordCategoryLabel, setKeywordCategoryLabel] = useState<string | null>(null);

  // 센서 상태 업데이트 함수 (값과 상태 모두 업데이트)
  const updateSensorStatus = useCallback((
    sensor: keyof SensorStates,
    status: SensorStatusLevel,
    value?: number
  ) => {
    setSensorStates(prev => {
      const currentState = prev[sensor];

      // 이미 잠금 상태면 pendingValue만 업데이트
      if (currentState.isLocked) {
        return {
          ...prev,
          [sensor]: {
            ...currentState,
            pendingValue: value ?? currentState.pendingValue,
          },
        };
      }

      const isAlert = status !== 'normal';

      return {
        ...prev,
        [sensor]: {
          status,
          value: value ?? currentState.value,
          lastUpdated: Date.now(),
          isLocked: isAlert, // 주의/경고 시 자동 잠금
          pendingValue: undefined, // 새로 잠금될 때 pending 클리어
        },
      };
    });
  }, []);

  // 센서 값만 업데이트 (잠금 상태면 pendingValue에 저장)
  const updateSensorValue = useCallback((
    sensor: keyof SensorStates,
    value: number
  ) => {
    setSensorStates(prev => {
      const currentState = prev[sensor];

      // 잠금 상태면 pendingValue에 저장 (해제 시 적용됨)
      if (currentState.isLocked) {
        return {
          ...prev,
          [sensor]: {
            ...currentState,
            pendingValue: value,
          },
        };
      }

      return {
        ...prev,
        [sensor]: {
          ...currentState,
          value,
          lastUpdated: Date.now(),
          pendingValue: undefined, // 정상 상태면 pending 클리어
        },
      };
    });
  }, []);

  // 센서 잠금 해제 함수 (pendingValue가 있으면 적용) + API 호출
  const unlockSensor = useCallback(async (sensor: keyof SensorStates) => {
    // 1. 로컬 상태 먼저 업데이트 (UI 반응성)
    setSensorStates(prev => {
      const currentState = prev[sensor];
      return {
        ...prev,
        [sensor]: {
          ...currentState,
          status: 'normal',
          isLocked: false,
          // pendingValue가 있으면 적용, 없으면 현재 값 유지
          value: currentState.pendingValue ?? currentState.value,
          pendingValue: undefined,
          lastUpdated: Date.now(),
        },
      };
    });

    // emotion 센서 해제 시 카테고리 라벨도 초기화
    if (sensor === 'emotion') {
      setKeywordCategoryLabel(null);
    }

    // 2. API 호출하여 DB의 alert acknowledge + room metadata 업데이트
    if (roomName) {
      try {
        const token = localStorage.getItem('admin_access_token');
        if (!token) {
          console.warn('[Sidebar] No auth token for acknowledge API');
          return;
        }

        const response = await fetch(`${API_BASE}/v1/guardians/alerts/acknowledge-by-type`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            roomName,
            sensorType: sensor,
          }),
        });

        if (!response.ok) {
          console.error('[Sidebar] Failed to acknowledge by type:', response.status);
        } else {
          const result = await response.json();
          console.log(`[Sidebar] Acknowledged ${sensor} alerts:`, result);

          // 모든 alert이 해제되었으면 onClearDanger 호출 (UI 동기화)
          if (result.acknowledgedCount > 0) {
            // 다른 센서에 alert이 남아있는지 확인
            const hasOtherLockedSensors = Object.entries(sensorStates).some(
              ([key, state]) => key !== sensor && state.isLocked
            );

            if (!hasOtherLockedSensors) {
              // 모든 센서가 해제됨 - onClearDanger 호출하여 Grid 테두리도 업데이트
              onClearDanger?.();
            }
          }
        }
      } catch (error) {
        console.error('[Sidebar] Error acknowledging by type:', error);
      }
    }
  }, [roomName, sensorStates, onClearDanger]);

  // 잠금 상태가 아닌 센서만 30초 후 자동으로 normal 상태로 복구
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const RESET_DELAY = 30000; // 30초

      setSensorStates(prev => {
        const updated = { ...prev };
        let changed = false;

        (Object.keys(prev) as Array<keyof SensorStates>).forEach(sensor => {
          const state = prev[sensor];
          // 잠금 상태가 아니고, normal이 아니고, 30초 지났으면 복구
          if (!state.isLocked && state.status !== 'normal' && now - state.lastUpdated > RESET_DELAY) {
            updated[sensor] = {
              ...state,
              status: 'normal',
              lastUpdated: now,
            };
            changed = true;
          }
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // isDanger가 false가 되면 모든 센서 상태 리셋
  useEffect(() => {
    if (!isDanger) {
      setSensorStates({
        emotion: initialSensorState,
        audio: initialSensorState,
        motion: initialSensorState,
        face: initialSensorState,
      });
    }
  }, [isDanger]);

  // Convert dangerCode to DetectionInfo if available
  const dangerCodeDetectionInfo = dangerCode
    ? dangerCodeToDetectionInfo(dangerCode)
    : null;

  // Priority: prop detectionInfo > local state from DataChannel (most specific) > dangerCode-based (generic)
  const activeDetectionInfo =
    detectionInfo ?? localDetectionInfo ?? dangerCodeDetectionInfo;

  // Fetch initial transcripts from API
  useEffect(() => {
    if (!roomName || !apiBase || initialLoaded) return;

    const fetchTranscripts = async () => {
      try {
        const res = await fetch(
          `${apiBase}/v1/calls/room/${encodeURIComponent(
            roomName,
          )}/transcripts`,
        );
        if (!res.ok) {
          console.warn('[Sidebar] Failed to fetch transcripts:', res.status);
          return;
        }
        const data = await res.json();
        if (data.transcripts && Array.isArray(data.transcripts)) {
          const mapped = data.transcripts.map(
            (t: { speaker: string; text: string; timestamp?: string }) => ({
              role: t.speaker === 'user' ? 'user' : 'agent',
              text: t.text,
              timestamp: t.timestamp
                ? new Date(t.timestamp).getTime()
                : Date.now(),
            }),
          );
          setTranscripts(mapped);
          setInitialLoaded(true);
        }
      } catch (e) {
        console.error('[Sidebar] Error fetching transcripts:', e);
      }
    };

    fetchTranscripts();
  }, [roomName, apiBase, initialLoaded]);

  // 초기 alert 상태 로드 (Fullscreen 진입 시 이전 이벤트 반영)
  // roomName이 변경되면 다시 로드
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  useEffect(() => {
    // roomName 변경 시 로드 상태 리셋
    setAlertsLoaded(false);
  }, [roomName]);

  useEffect(() => {
    if (!roomName || alertsLoaded) return;

    const fetchActiveAlerts = async () => {
      try {
        const token = localStorage.getItem('admin_access_token');
        if (!token) {
          console.warn('[Sidebar] No auth token for active alerts fetch');
          return;
        }

        const res = await fetch(
          `${API_BASE}/v1/guardians/alerts/by-room/${encodeURIComponent(roomName)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          console.warn('[Sidebar] Failed to fetch active alerts:', res.status);
          return;
        }

        const data = await res.json();
        console.log('[Sidebar] Loaded active alerts:', data);

        // 센서 상태 초기화
        if (data.sensorStates) {
          setSensorStates(prev => {
            const updated = { ...prev };
            (Object.keys(data.sensorStates) as Array<keyof SensorStates>).forEach(sensor => {
              const apiState = data.sensorStates[sensor];
              if (apiState.hasAlert) {
                updated[sensor] = {
                  ...prev[sensor],
                  status: apiState.status,
                  isLocked: true, // alert이 있으면 잠금 상태
                  lastUpdated: Date.now(),
                };
              }
            });
            return updated;
          });
        }

        // Detection info 초기화
        if (data.detectionInfo) {
          setLocalDetectionInfo(data.detectionInfo);
        }

        // 키워드 추출 (speech_keyword alert에서)
        // Agent 구조: rawPayload = { type, payload: { categoryLabel, matchedKeywords } }
        // iOS 구조: rawPayload = { categoryLabel, matchedKeywords }
        if (data.alerts && Array.isArray(data.alerts)) {
          const keywords: string[] = [];
          for (const alert of data.alerts) {
            if (alert.alertType === 'speech_keyword' && alert.rawPayload) {
              // 중첩 구조 처리: rawPayload.payload 또는 rawPayload 직접
              const payload = alert.rawPayload.payload ?? alert.rawPayload;
              if (payload.matchedKeywords && Array.isArray(payload.matchedKeywords)) {
                keywords.push(...payload.matchedKeywords);
              } else if (payload.matchedKeyword) {
                keywords.push(String(payload.matchedKeyword));
              }
              // 카테고리 라벨 설정
              if (payload.categoryLabel && !keywordCategoryLabel) {
                setKeywordCategoryLabel(String(payload.categoryLabel));
              }
            }
          }
          if (keywords.length > 0) {
            // 중복 제거 및 부분 문자열 필터링 (실시간 DataChannel과 동일)
            // 예: ["배", "아파", "배가 아"] -> ["배", "아파"]
            const rawKeywords = [...new Set(keywords)];
            const uniqueKeywords = rawKeywords.filter(keyword =>
              !rawKeywords.some(other => other !== keyword && keyword.includes(other))
            );
            setDetectedKeywords(prev => [...new Set([...prev, ...uniqueKeywords])]);
          }
        }

        setAlertsLoaded(true);
      } catch (e) {
        console.error('[Sidebar] Error fetching active alerts:', e);
      }
    };

    fetchActiveAlerts();
  }, [roomName, alertsLoaded, keywordCategoryLabel]);

  // Deduplicated transcript adder - prevents duplicates from API + real-time overlap
  const addTranscript = useCallback((newTranscript: Transcript) => {
    setTranscripts(prev => {
      // Only check the last 50 items for performance on long conversations
      const recentTranscripts = prev.slice(-50);

      // Check for duplicate: same role, same text, within 5 seconds
      const isDuplicate = recentTranscripts.some(
        t =>
          t.role === newTranscript.role &&
          t.text === newTranscript.text &&
          Math.abs(t.timestamp - newTranscript.timestamp) < 5000,
      );

      if (isDuplicate) return prev;

      const newList = [...prev, newTranscript];
      const lastTimestamp = prev[prev.length - 1]?.timestamp ?? 0;

      // Only sort if new item is out of order
      return newTranscript.timestamp < lastTimestamp
        ? newList.sort((a, b) => a.timestamp - b.timestamp)
        : newList;
    });
  }, []);

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
      topic?: string,
    ) => {
      try {
        const strData = new TextDecoder().decode(payload);
        console.log(
          '[Sidebar] Received data:',
          strData,
          'kind:',
          kind,
          'topic:',
          topic,
          'participant:',
          participant?.identity,
        );
        const data = JSON.parse(strData);

        if (data.type === 'transcript') {
          console.log('[Sidebar] Processing transcript:', data);
          addTranscript({
            role: data.role,
            text: data.text,
            timestamp: data.timestamp || Date.now(),
          });
        }

        // Handle alert_response from agent with detectionInfo
        if (topic === 'alert_response' && data.detectionInfo) {
          console.log('[Sidebar] Received detection info:', data.detectionInfo);
          setLocalDetectionInfo(data.detectionInfo);

          // 센서 상태 업데이트
          const alertType = data.alertType || data.detectionInfo?.type;
          const riskLevel = data.riskLevel || data.severity || data.detectionInfo?.severity;

          if (alertType && ALERT_TYPE_TO_SENSOR[alertType]) {
            const sensor = ALERT_TYPE_TO_SENSOR[alertType];
            let status: SensorStatusLevel = 'normal';

            if (riskLevel === 'critical' || riskLevel === 'high') {
              status = 'critical';
            } else if (riskLevel === 'caution' || riskLevel === 'medium') {
              status = 'caution';
            }

            console.log(`[Sidebar] Updating sensor ${sensor} to ${status}`);
            updateSensorStatus(sensor, status);
          }
        }

        // Handle care_alert topic directly
        if (topic === 'care_alert' && data.alertType) {
          const alertType = data.alertType;
          const riskLevel = data.data?.payload?.riskLevel || data.severity;

          if (ALERT_TYPE_TO_SENSOR[alertType]) {
            const sensor = ALERT_TYPE_TO_SENSOR[alertType];
            let status: SensorStatusLevel = 'normal';

            if (riskLevel === 'critical' || riskLevel === 'high') {
              status = 'critical';
            } else if (riskLevel === 'caution' || riskLevel === 'medium') {
              status = 'caution';
            }

            // confidence 값 추출하여 status와 value를 pair로 전달
            const confidence = data.data?.payload?.confidence;
            const value = confidence !== undefined ? Math.round(confidence * 100) : undefined;

            console.log(`[Sidebar] Care alert: ${sensor} -> ${status} (value: ${value})`);
            updateSensorStatus(sensor, status, value);
          }
        }

        // Handle sensor_stream topic (iOS에서 보내는 실시간 센서 데이터)
        // iOS 형식: { timestamp, emotion?: {...}, audio?: {...}, motion?: {...}, face?: {...} }
        if (topic === 'sensor_stream') {
          console.log('[Sidebar] sensor_stream received:', data);
          // emotion 데이터 처리
          if (data.emotion) {
            const emotionValue = data.emotion.confidence !== undefined
              ? Math.round(data.emotion.confidence * 100)
              : undefined;
            if (emotionValue !== undefined) {
              updateSensorValue('emotion', emotionValue);
            }
          }

          // audio 데이터 처리
          if (data.audio) {
            // level을 우선 사용 (0.0~1.0 -> 0~100%)
            // decibel은 -160~0 dB 범위 (-60dB 이상을 유효 범위로 가정)
            const audioValue = data.audio.level !== undefined
              ? Math.round(data.audio.level * 100)
              : (data.audio.decibel !== undefined
                ? Math.min(100, Math.max(0, Math.round((data.audio.decibel + 60) * (100 / 60))))
                : undefined);
            if (audioValue !== undefined) {
              updateSensorValue('audio', audioValue);
            }
          }

          // motion 데이터 처리 (iOS는 camelCase: fallRisk)
          if (data.motion) {
            const motionValue = data.motion.fallRisk !== undefined
              ? Math.round(data.motion.fallRisk * 100)
              : undefined;
            if (motionValue !== undefined) {
              updateSensorValue('motion', motionValue);
            }
          }

          // face 데이터 처리 (iOS는 camelCase: faceY, isDetected)
          if (data.face) {
            const faceValue = data.face.faceY !== undefined
              ? Math.min(100, Math.max(0, Math.round(data.face.faceY * 100)))
              : undefined;
            if (faceValue !== undefined) {
              updateSensorValue('face', faceValue);
            }
          }
        }

        // Handle sensor_status topic (Agent로부터 실시간 센서 상태 수신)
        if (topic === 'sensor_status') {
          const sensorData = data as SensorStatusMessage;

          // emotion 센서 상태 업데이트
          if (sensorData.emotion) {
            const emotionValue = sensorData.emotion.confidence !== undefined
              ? Math.round(sensorData.emotion.confidence * 100)
              : undefined;

            if (sensorData.emotion.status === 'normal') {
              if (emotionValue !== undefined) updateSensorValue('emotion', emotionValue);
            } else {
              updateSensorStatus('emotion', sensorData.emotion.status, emotionValue);
            }
          }

          // audio 센서 상태 업데이트
          // level 우선 사용 (0.0~1.0 -> 0~100%), decibel은 -160~0 범위
          if (sensorData.audio) {
            const audioValue = sensorData.audio.level !== undefined
              ? Math.round(sensorData.audio.level * 100)
              : undefined;

            if (sensorData.audio.status === 'normal') {
              if (audioValue !== undefined) updateSensorValue('audio', audioValue);
            } else {
              updateSensorStatus('audio', sensorData.audio.status, audioValue);
            }
          }

          // motion 센서 상태 업데이트
          if (sensorData.motion) {
            const motionValue = sensorData.motion.fallRisk !== undefined
              ? Math.round(sensorData.motion.fallRisk * 100)
              : undefined;

            if (sensorData.motion.status === 'normal') {
              if (motionValue !== undefined) updateSensorValue('motion', motionValue);
            } else {
              updateSensorStatus('motion', sensorData.motion.status, motionValue);
            }
          }

          // face 센서 상태 업데이트
          if (sensorData.face) {
            const faceValue = sensorData.face.faceY !== undefined
              ? Math.min(100, Math.max(0, Math.round(sensorData.face.faceY * 100)))
              : undefined;

            if (sensorData.face.status === 'normal') {
              if (faceValue !== undefined) updateSensorValue('face', faceValue);
            } else {
              updateSensorStatus('face', sensorData.face.status, faceValue);
            }
          }
        }

        // speech_alert 토픽: 발화 키워드 감지 시 emotion 상태 업데이트
        if (topic === 'speech_alert') {
          const speechData = data as {
            timestamp: number;
            wardId: string;
            speech: {
              status: 'caution' | 'critical';
              category: string;
              categoryLabel: string;
              matchedKeyword: string;
              matchedKeywords: string[];
              text: string;
              matchCount: number;
            };
          };

          if (speechData.speech) {
            // 발화 키워드 감지 시 emotion 센서 상태를 caution/critical로 업데이트
            const emotionValue = Math.round(speechData.speech.matchCount * 10); // matchCount 기반 값
            updateSensorStatus('emotion', speechData.speech.status, Math.min(100, emotionValue));

            // 중복 제거 및 부분 문자열 필터링 (음영처리와 감지 기준에서 동일하게 사용)
            // 예: ["배", "아파", "배가 아"] -> ["배", "아파"] (짧은 키워드가 포함된 긴 키워드 제거)
            const rawKeywords = speechData.speech.matchedKeywords?.length > 0
              ? [...new Set(speechData.speech.matchedKeywords)]
              : [];
            const uniqueKeywords = rawKeywords.filter(keyword => {
              // 다른 키워드 중 이 키워드를 포함하는 더 짧은 키워드가 있으면 제외
              return !rawKeywords.some(other =>
                other !== keyword && keyword.includes(other)
              );
            });

            // Agent가 감지한 키워드를 하이라이트용으로 추가 (단일 소스)
            if (uniqueKeywords.length > 0) {
              setDetectedKeywords(prev => [...new Set([...prev, ...uniqueKeywords])]);
            }

            // 키워드 카테고리 라벨 저장 (예: "두통", "복통", "우울감")
            if (speechData.speech.categoryLabel) {
              setKeywordCategoryLabel(speechData.speech.categoryLabel);
            }

            // 키워드 감지에 맞는 detectionInfo 설정 (음영처리와 동일한 키워드 사용)
            const keywordsDisplay = uniqueKeywords.length > 0
              ? uniqueKeywords.join(', ')
              : speechData.speech.matchedKeyword || '';
            setLocalDetectionInfo({
              type: 'speech_keyword',
              severity: speechData.speech.status === 'critical' ? 'high' : 'medium',
              criteria: [
                {
                  name: '감지 유형',
                  value: speechData.speech.categoryLabel || '키워드',
                  level: speechData.speech.status === 'critical' ? 'high' : 'medium',
                },
                {
                  name: '감지 키워드',
                  value: keywordsDisplay,
                  level: speechData.speech.status === 'critical' ? 'high' : 'medium',
                },
              ],
            });

            console.log(
              `[Sidebar] Speech alert: ${speechData.speech.categoryLabel} ` +
              `keyword="${speechData.speech.matchedKeyword}" status=${speechData.speech.status}`
            );
          }
        }
      } catch (e) {
        console.error('[Sidebar] Failed to parse data packet:', e);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, addTranscript, updateSensorStatus, updateSensorValue, setDetectedKeywords]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      // Scroll only the chat container, not the entire panel
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
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
        onClick={e => {
          // Only close if clicking directly on the backdrop itself
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      />

      {/* Floating Sidebar - positioned below navbar */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: isHeaderHidden ? 0 : 'var(--header-height, 64px)',
          width: 'min(420px, 90vw)',
          height: isHeaderHidden ? '100vh' : 'calc(100vh - var(--header-height, 64px))',
          background: 'linear-gradient(180deg, #F7F9F2 0%, #F0F5E8 70%)',
          borderLeft: effectiveRiskLevel !== 'normal' ? `3px solid ${sidebarBorderColor}` : '1px solid rgba(148,163,184,0.35)',
          zIndex: 70,
          color: '#4A5D23',
          boxShadow: '-40px 0 80px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
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

        {/* 센서 상태 표시 */}
        <div style={{ padding: '16px 32px 0 32px', flexShrink: 0 }}>
          <SensorStatusIndicator
            states={sensorStates}
            onUnlock={unlockSensor}
          />
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px 32px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overscrollBehavior: 'contain',
            minHeight: 0,
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
                    {activeDetectionInfo
                      ? `${ALERT_TYPE_LABELS[activeDetectionInfo.type] || activeDetectionInfo.type} · ${SEVERITY_LABELS[activeDetectionInfo.severity] || activeDetectionInfo.severity}`
                      : '대화 내용 및 분석 결과를 확인하고 즉시 대응하세요'}
                  </div>
                </div>
              </div>

              {/* Detection Criteria - shown when detectionInfo is available */}
              {activeDetectionInfo &&
                activeDetectionInfo.criteria.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '4px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#991b1b',
                        marginBottom: '4px',
                      }}
                    >
                      감지 기준
                    </div>
                    {activeDetectionInfo.criteria.map((criterion, idx) => {
                      const colors =
                        LEVEL_COLORS[criterion.level] || LEVEL_COLORS.medium;
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '16px',
                              color: '#7f1d1d',
                              fontWeight: 500,
                            }}
                          >
                            {criterion.name}
                          </span>
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {DETECTION_VALUE_LABELS[criterion.value] ||
                              criterion.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
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

                    // Try multiple strategies to find the beneficiary
                    const hasBeneficiaryId = !!participant.beneficiaryId;

                    // Extract wardId from roomName if available (format: room_ward_{wardId}_xxx or similar)
                    let wardIdFromRoom: string | undefined;
                    if (roomName) {
                      // Try to extract wardId from room name patterns
                      const roomMatch = roomName.match(/ward[_-]([a-f0-9-]+)/i);
                      if (roomMatch) {
                        wardIdFromRoom = roomMatch[1];
                      }
                    }

                    const idToUse =
                      participant.beneficiaryId ||
                      wardIdFromRoom ||
                      participant.id;
                    console.log('[DetailButton] Opening detail for:', {
                      participantId: participant.id,
                      participantName: participant.name,
                      beneficiaryId: participant.beneficiaryId,
                      wardIdFromRoom,
                      idToUse,
                      roomName,
                      hasBeneficiaryId,
                    });

                    setLoadingDetail(true);
                    try {
                      // Get auth token
                      const token = localStorage.getItem('admin_access_token');
                      if (!token) {
                        throw new Error('로그인이 필요합니다.');
                      }

                      let result = null;
                      let lastError = null;

                      // Strategy 1: Use beneficiaryId directly if available
                      if (hasBeneficiaryId) {
                        const url = `${API_BASE}/v1/admin/beneficiaries/${participant.beneficiaryId}`;
                        console.log(
                          '[DetailButton] Trying beneficiaryId:',
                          url,
                        );
                        const response = await fetch(url, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (response.ok) {
                          result = await response.json();
                        } else {
                          lastError = response.status;
                        }
                      }

                      // Strategy 2: Try by-ward endpoint using wardIdFromRoom
                      if (!result && wardIdFromRoom) {
                        const url = `${API_BASE}/v1/admin/beneficiaries/by-ward/${encodeURIComponent(wardIdFromRoom)}`;
                        console.log('[DetailButton] Trying by-ward:', url);
                        const response = await fetch(url, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (response.ok) {
                          result = await response.json();
                        } else {
                          lastError = response.status;
                        }
                      }

                      // Strategy 3: Try by-user endpoint with participant.id
                      if (!result && participant.id) {
                        const url = `${API_BASE}/v1/admin/beneficiaries/by-user/${encodeURIComponent(participant.id)}`;
                        console.log('[DetailButton] Trying by-user:', url);
                        const response = await fetch(url, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (response.ok) {
                          result = await response.json();
                        } else {
                          lastError = response.status;
                        }
                      }

                      // Strategy 4: Try using participant name to search
                      if (!result && participant.name) {
                        const url = `${API_BASE}/v1/admin/beneficiaries?search=${encodeURIComponent(participant.name)}&limit=1`;
                        console.log(
                          '[DetailButton] Trying search by name:',
                          url,
                        );
                        const response = await fetch(url, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (response.ok) {
                          const searchResult = await response.json();
                          if (
                            searchResult.data &&
                            searchResult.data.length > 0
                          ) {
                            // Fetch full detail for the first match
                            const detailUrl = `${API_BASE}/v1/admin/beneficiaries/${searchResult.data[0].id}`;
                            const detailResponse = await fetch(detailUrl, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (detailResponse.ok) {
                              result = await detailResponse.json();
                            }
                          }
                        }
                      }

                      if (!result) {
                        throw new Error(
                          `대상자 정보를 찾을 수 없습니다. (마지막 에러: ${lastError || 'unknown'})`,
                        );
                      }

                      console.log('[DetailButton] Received data:', result);
                      setBeneficiaryDetail(result.data);
                      setShowDetailModal(true);
                    } catch (error) {
                      console.error(
                        '[DetailButton] Failed to load beneficiary detail:',
                        error,
                      );
                      alert(
                        `대상자 정보를 불러오는데 실패했습니다.\n\nParticipant: ${participant.name}\nRoom: ${roomName || 'N/A'}\n\n${error instanceof Error ? error.message : String(error)
                        }`,
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
                    fontSize: '16px',
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
                ref={chatContainerRef}
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
                {transcripts.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: '16px',
                      color: '#9ca3af',
                      padding: '16px 0',
                    }}
                  >
                    대화 내역이 없습니다.
                  </div>
                ) : (
                  transcripts.map((t, i) => {
                    const isAgent = t.role === 'agent';
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: isAgent ? 'flex-start' : 'flex-end',
                          marginBottom: '12px',
                        }}
                      >
                        <div
                          style={{
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
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <span>{isAgent ? '소담이' : '어르신'}</span>
                            <span style={{ fontWeight: 400 }}>
                              {new Date(t.timestamp).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {/* Highlight danger keywords in text */}
                          {highlightDangerKeywords(t.text, detectedKeywords)}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={transcriptEndRef} />
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

          {/* Clear Danger Button - shown for both danger and caution states */}
          {(isDanger || riskLevel === 'caution') && (
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
                fontSize: '16px',
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
              경고 상태 해제
            </button>
          )}

          {/* Status text */}
          {!isDanger && (
            <p
              style={{
                fontSize: '16px',
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
                `${API_BASE}/api/beneficiaries/${participant.beneficiaryId}`,
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
