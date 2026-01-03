import {
  X,
  MonitorPlay,
  User,
  Stethoscope,
  Pill,
  Contact,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { ReactNode } from 'react';
import type { MockParticipant } from './ParticipantSidebar';

type ParticipantDetailSidebarProps = {
  participant: MockParticipant;
  onClose: () => void;
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
                color: '#0f172a',
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
              color: '#475569',
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
}: ParticipantDetailSidebarProps) => {
  const isWarning = participant.status === 'WARNING';
  const accentColor = isWarning ? '#f87171' : '#38bdf8';

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
          background: 'linear-gradient(180deg, #f9fbff 0%, #f1f5f9 70%)',
          borderLeft: '1px solid rgba(148,163,184,0.35)',
          zIndex: 70,
          color: '#0f172a',
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
              <MonitorPlay size={26} strokeWidth={2.4} color="#0f172a" />
              <h3
                style={{
                  fontWeight: 800,
                  fontSize: '20px',
                  color: '#0f172a',
                }}
              >
                세부 모니터링
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '10px',
                background: '#f8fafc',
                whiteSpace: 'nowrap',
                margin: 0,
                border: '1px solid rgba(203,213,225,1)',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                color: '#0f172a',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#ffffff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#f8fafc';
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
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
                  color: '#0f172a',
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
                      color: '#1d4ed8',
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
                  color: '#0f172a',
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
                  background: '#f8fafc',
                  borderRadius: '16px',
                  border: '1px solid rgba(226,232,240,1)',
                  padding: '14px',
                  maxHeight: '210px',
                  overflowY: 'auto',
                  boxShadow: 'inset 0 1px 6px rgba(15,23,42,0.05)',
                }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex justify-end opacity-60">
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '4px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#0ea5e9',
                          textAlign: 'right',
                        }}
                      >
                        AI
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#475569',
                          lineHeight: 1.5,
                          background: '#e0f2fe',
                          padding: '10px 12px',
                          borderRadius: '14px',
                          borderBottomRightRadius: '4px',
                          border: '1px solid rgba(14,165,233,0.35)',
                        }}
                      >
                        식사는 맛있게 하셨어요?
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '4px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#0ea5e9',
                          textAlign: 'right',
                        }}
                      >
                        AI
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#0f172a',
                          lineHeight: 1.5,
                          fontWeight: 600,
                          background: '#bae6fd',
                          padding: '10px 12px',
                          borderRadius: '14px',
                          borderBottomRightRadius: '4px',
                          border: '1px solid rgba(14,165,233,0.45)',
                        }}
                      >
                        어디 불편하신 곳은 없으시고요?
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#0f172a',
                        width: '32px',
                      }}
                    >
                      {participant.name.split(' ')[0]}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#0f172a',
                        fontWeight: 600,
                        background: isWarning
                          ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
                          : '#e2e8f0',
                        padding: '12px 14px',
                        borderRadius: '14px',
                        borderTopLeftRadius: '4px',
                        lineHeight: 1.6,
                        border: isWarning
                          ? `1px solid ${hexToRgba('#f87171', 0.6)}`
                          : '1px solid rgba(148,163,184,0.6)',
                        boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
                      }}
                    >
                      아이고.. 가슴이 자꾸 조여오네.. 숨 쉬기가 힘들어..
                    </div>
                  </div>
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
          }}
        >
          <button
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 70%)',
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
              boxShadow: '0 18px 35px rgba(244,143,177,0.4)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 24px 45px rgba(244,143,177,0.55)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 18px 35px rgba(244,143,177,0.4)';
            }}
          >
            <Phone size={20} />
            긴급 통화 개입 (Takeover)
          </button>
          <p
            style={{
              fontSize: '11px',
              textAlign: 'center',
              color: '#94a3b8',
              marginTop: '12px',
              fontWeight: 600,
            }}
          >
            관리자 권한으로 즉시 개입 가능
          </p>
        </div>
      </div>
    </>
  );
};
