'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { Card } from '../../components/ui';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  Copy,
  Check,
  Search,
  Download,
} from 'lucide-react';
import { useDashboardApi } from '../../hooks';
import {
  formatDateWithHour,
  getDateRangeForStatsPeriod,
  parseDateInput,
  type StatsPeriodFilter,
  STATS_PERIOD_LABELS,
} from '../../lib/date-utils';
import '../../styles/dashboard.css';

// --- Types ---
type EmergencyLogItem = {
  id: string;
  datetime: Date | string;
  beneficiaryName: string;
  type: string;
  status: 'resolved' | 'false_positive' | 'pending' | 'error';
  manager?: string;
  summary?: string;
  severity?: string;
  alertType?: string;
};

const STATUS_MAP = {
  resolved: {
    label: '대응완료',
    className: 'status-resolved',
    icon: CheckCircle2,
  },
  false_positive: {
    label: '오탐',
    className: 'status-false-positive',
    icon: XCircle,
  },
  pending: { label: '대기', className: 'status-pending', icon: Clock },
  error: { label: '오류', className: 'status-error', icon: XCircle },
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  device_fall: '기기 낙상',
  person_fall: '사람 낙상',
  loud_voice: '큰 소리',
  emotion: '감정 분석',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  critical: '위급',
};

const MANAGER_OPTIONS = ['', '박간호사', '김담당', '이매니저', '최상담사'];

export default function EmergencyLogsPage() {
  const { getCareAlerts } = useDashboardApi();

  // Period and date state
  const [period, setPeriod] = useState<StatsPeriodFilter>('weekly');
  const [startDate, setStartDate] = useState(
    () => getDateRangeForStatsPeriod('weekly').startDate,
  );
  const [endDate, setEndDate] = useState(
    () => getDateRangeForStatsPeriod('weekly').endDate,
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Logs state
  const [logs, setLogs] = useState<EmergencyLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail modal state
  const [detailLog, setDetailLog] = useState<EmergencyLogItem | null>(null);
  const [editManager, setEditManager] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editStatus, setEditStatus] =
    useState<EmergencyLogItem['status']>('pending');
  const [copied, setCopied] = useState(false);

  // Handle period change
  const handlePeriodChange = useCallback((newPeriod: StatsPeriodFilter) => {
    setPeriod(newPeriod);
    const range = getDateRangeForStatsPeriod(newPeriod);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }, []);

  // Handle manual date input changes
  const handleStartDateChange = useCallback((value: string) => {
    const parsed = parseDateInput(value);
    if (parsed) {
      setStartDate(value);
    }
  }, []);

  const handleEndDateChange = useCallback((value: string) => {
    const parsed = parseDateInput(value);
    if (parsed) {
      setEndDate(value);
    }
  }, []);

  // Load logs
  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      // Calculate hours back from date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const hoursBack =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)) + 24;

      const result = await getCareAlerts({
        limit: 200,
        hoursBack: Math.max(hoursBack, 168),
      });
      if (result && result.logs) {
        const items: EmergencyLogItem[] = result.logs
          .filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= start && logDate <= end;
          })
          .map(log => ({
            id: log.id,
            datetime: new Date(log.timestamp),
            beneficiaryName: log.wardName,
            type: ALERT_TYPE_LABELS[log.alertType] || log.type,
            status:
              log.status === 'pending'
                ? 'pending'
                : log.status === 'false_positive'
                  ? 'false_positive'
                  : 'resolved',
            manager: '',
            summary: '',
            severity: log.severity,
            alertType: log.alertType,
          }));
        setLogs(items);
      }
      setLoading(false);
    };
    loadLogs();
  }, [getCareAlerts, startDate, endDate]);

  // Filter logs by search query
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.beneficiaryName.toLowerCase().includes(query) ||
      log.type.toLowerCase().includes(query) ||
      (log.manager && log.manager.toLowerCase().includes(query))
    );
  });

  // Modal handlers
  const handleOpenDetail = (log: EmergencyLogItem) => {
    setDetailLog(log);
    setEditManager(log.manager || '');
    setEditSummary(log.summary || '');
    setEditStatus(log.status);
    setCopied(false);
  };

  const handleCloseDetail = () => {
    setDetailLog(null);
  };

  const handleSave = () => {
    if (detailLog) {
      // Update local state
      setLogs(prev =>
        prev.map(log =>
          log.id === detailLog.id
            ? {
                ...log,
                manager: editManager,
                summary: editSummary,
                status: editStatus,
              }
            : log,
        ),
      );
    }
    handleCloseDetail();
  };

  const generateCopyText = () => {
    if (!detailLog) return '';
    const statusInfo = STATUS_MAP[editStatus];
    return `[위급 감지 보고서]
일시: ${formatDateWithHour(detailLog.datetime)}
대상자: ${detailLog.beneficiaryName}
유형: ${detailLog.type}
심각도: ${detailLog.severity ? SEVERITY_LABELS[detailLog.severity] || detailLog.severity : '미정'}
상태: ${statusInfo.label}
담당자: ${editManager || '미지정'}
요약: ${editSummary || '내용 없음'}`;
  };

  const handleCopy = async () => {
    const text = generateCopyText();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (err) {
      console.error('Copy failed', err);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  const handleDownload = () => {
    alert('다운로드 기능은 추후 구현 예정입니다.');
  };

  return (
    <DashboardLayout>
      <div className="stats-container">
        {/* Period Filter with Search */}
        <div className="stats-filter-section">
          {/* Search Bar */}
          <div className="emergency-logs-search">
            <Search size={18} className="emergency-logs-search-icon" />
            <input
              type="text"
              placeholder="대상자 이름, 유형으로 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="emergency-logs-search-input"
            />
          </div>

          {/* Period Presets */}
          <div className="stats-filter-presets">
            {(Object.keys(STATS_PERIOD_LABELS) as StatsPeriodFilter[]).map(
              key => (
                <button
                  key={key}
                  className={`stats-filter-btn ${period === key ? 'active' : ''}`}
                  onClick={() => handlePeriodChange(key)}
                >
                  {STATS_PERIOD_LABELS[key]}
                </button>
              ),
            )}
          </div>

          {/* Date Range */}
          <div className="stats-filter-dates">
            <input
              type="date"
              className="stats-date-input"
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>~</span>
            <input
              type="date"
              className="stats-date-input"
              value={endDate}
              onChange={e => handleEndDateChange(e.target.value)}
            />
          </div>

          <div className="stats-filter-spacer" />
          <button className="stats-download-btn" onClick={handleDownload}>
            <Download size={16} />
            다운로드
          </button>
        </div>

        {/* Emergency Logs Table */}
        <Card padding="md" className="emergency-log-card">
          <div className="emergency-log-module-header">
            <AlertTriangle size={26} className="emergency-log-module-icon" />
            <h3 className="emergency-log-module-title">위급 감지 로그</h3>
            <span className="emergency-log-module-count-badge">
              {filteredLogs.length}건
            </span>
          </div>

          <div className="emergency-log-module-content">
            {loading ? (
              <div className="emergency-log-loading">로딩 중...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="emergency-log-empty">
                <CheckCircle2 size={32} />
                <p>해당 기간에 감지된 위급 상황이 없습니다.</p>
              </div>
            ) : (
              <div className="emergency-log-table-wrap">
                <table className="emergency-log-table emergency-log-table-lg">
                  <thead>
                    <tr>
                      <th>일시</th>
                      <th>대상자</th>
                      <th>유형</th>
                      <th>심각도</th>
                      <th>상태</th>
                      <th>상세정보</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => {
                      const statusInfo = STATUS_MAP[log.status];
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={log.id}>
                          <td className="emergency-log-datetime">
                            {formatDateWithHour(log.datetime)}
                          </td>
                          <td>{log.beneficiaryName}</td>
                          <td>{log.type}</td>
                          <td>
                            <span
                              className={`emergency-severity-badge severity-${log.severity || 'medium'}`}
                            >
                              {log.severity
                                ? SEVERITY_LABELS[log.severity] || log.severity
                                : '-'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`emergency-log-status ${statusInfo.className}`}
                            >
                              <StatusIcon size={16} />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td>
                            <button
                              className="emergency-log-view-btn"
                              onClick={() => handleOpenDetail(log)}
                            >
                              <Eye size={16} />
                              보기
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detail Modal */}
      {detailLog && (
        <div className="bulletin-overlay" onClick={handleCloseDetail}>
          <div
            className="bulletin-dialog emergency-detail-dialog"
            onClick={e => e.stopPropagation()}
          >
            <div className="bulletin-dialog-header">
              <h3>위급 감지 상세정보</h3>
              <button
                className="bulletin-dialog-close"
                onClick={handleCloseDetail}
              >
                <X size={20} />
              </button>
            </div>
            <div className="bulletin-dialog-body">
              {/* Fixed Fields */}
              <div className="emergency-detail-grid">
                <div className="emergency-detail-field">
                  <span className="emergency-detail-label">일시</span>
                  <span className="emergency-detail-value">
                    {formatDateWithHour(detailLog.datetime)}
                  </span>
                </div>
                <div className="emergency-detail-field">
                  <span className="emergency-detail-label">대상자</span>
                  <span className="emergency-detail-value">
                    {detailLog.beneficiaryName}
                  </span>
                </div>
                <div className="emergency-detail-field">
                  <span className="emergency-detail-label">유형</span>
                  <span className="emergency-detail-value">
                    {detailLog.type}
                  </span>
                </div>
                <div className="emergency-detail-field">
                  <span className="emergency-detail-label">심각도</span>
                  <span
                    className={`emergency-detail-value severity-text-${detailLog.severity || 'medium'}`}
                  >
                    {detailLog.severity
                      ? SEVERITY_LABELS[detailLog.severity] ||
                        detailLog.severity
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="emergency-detail-editable">
                <div className="bulletin-dialog-field">
                  <label className="bulletin-dialog-label">상태</label>
                  <div className="emergency-status-buttons">
                    <button
                      type="button"
                      className={`emergency-status-btn ${editStatus === 'false_positive' ? 'active false-positive' : ''}`}
                      onClick={() => setEditStatus('false_positive')}
                    >
                      <XCircle size={16} />
                      오탐
                    </button>
                    <button
                      type="button"
                      className={`emergency-status-btn ${editStatus === 'resolved' ? 'active resolved' : ''}`}
                      onClick={() => setEditStatus('resolved')}
                    >
                      <CheckCircle2 size={16} />
                      대응완료
                    </button>
                  </div>
                </div>
                <div className="bulletin-dialog-field">
                  <label className="bulletin-dialog-label">담당자</label>
                  <select
                    className="emergency-detail-select"
                    value={editManager}
                    onChange={e => setEditManager(e.target.value)}
                  >
                    <option value="">미지정</option>
                    {MANAGER_OPTIONS.filter(m => m).map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bulletin-dialog-field">
                  <label className="bulletin-dialog-label">요약</label>
                  <textarea
                    className="bulletin-dialog-textarea"
                    placeholder="상황 발생 및 대처 내용을 입력하세요..."
                    value={editSummary}
                    onChange={e => setEditSummary(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Copy Button */}
              <button
                className="emergency-detail-copy-btn"
                onClick={handleCopy}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? '복사됨!' : '전체 내용 복사'}
              </button>
            </div>
            <div className="bulletin-dialog-footer">
              <button
                className="bulletin-dialog-cancel"
                onClick={handleCloseDetail}
              >
                취소
              </button>
              <button className="bulletin-dialog-save" onClick={handleSave}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
