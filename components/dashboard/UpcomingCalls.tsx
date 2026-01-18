'use client';

import { Phone, User, Clock } from 'lucide-react';
import Card from '../ui/Card';
import '../../styles/dashboard.css';

export interface UpcomingCall {
  scheduleId: string;
  wardId: string;
  wardName: string;
  wardIdentity: string;
  aiPersona: string;
  scheduledTime: string; // HH:MM format
  slotStartHour: number;
  slotStartMinute: number;
}

interface UpcomingCallsProps {
  calls: UpcomingCall[];
  loading?: boolean;
}

/**
 * UpcomingCalls
 *
 * Displays upcoming scheduled calls that the server will initiate
 */
export default function UpcomingCalls({ calls, loading = false }: UpcomingCallsProps) {
  // Format time for display
  const formatTime = (hour: number, minute: number) => {
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour % 12 || 12;
    return `${period} ${displayHour}:${String(minute).padStart(2, '0')}`;
  };

  return (
    <Card padding="md" className="upcoming-calls-card">
      <div className="upcoming-calls-header">
        <Phone size={24} className="upcoming-calls-icon" />
        <h3 className="upcoming-calls-title">예정된 발신</h3>
        <span className="upcoming-calls-count">{calls.length}건</span>
      </div>

      <div className="upcoming-calls-content">
        {loading ? (
          <div className="upcoming-calls-loading">로딩 중...</div>
        ) : calls.length === 0 ? (
          <div className="upcoming-calls-empty">
            <Clock size={32} className="upcoming-calls-empty-icon" />
            <p>예정된 발신이 없습니다</p>
          </div>
        ) : (
          <div className="upcoming-calls-list">
            {calls.map((call) => (
              <div key={call.scheduleId} className="upcoming-call-item">
                <div className="upcoming-call-time">
                  {formatTime(call.slotStartHour, call.slotStartMinute)}
                </div>
                <div className="upcoming-call-info">
                  <div className="upcoming-call-name">
                    <User size={14} />
                    <span>{call.wardName}</span>
                  </div>
                  <div className="upcoming-call-persona">
                    {call.aiPersona}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
