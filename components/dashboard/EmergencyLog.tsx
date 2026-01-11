'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, XCircle, Eye, X, Copy, Check } from 'lucide-react';
import { Card } from '../ui';
import { formatDateWithHour } from '../../lib/date-utils';
import '../../styles/dashboard.css';

// --- Types ---
export type EmergencyLogItem = {
    id: string;
    datetime: Date | string;
    beneficiaryName: string;
    type: string;
    status: 'resolved' | 'pending' | 'error';
    manager?: string;
    summary?: string;
};

type EmergencyLogProps = {
    logs?: EmergencyLogItem[];
    loading?: boolean;
    onUpdate?: (id: string, updates: { manager?: string; summary?: string }) => void;
};

// Format date as "d/m(요) hh시"


// Mock data with Date objects
const MOCK_LOGS: EmergencyLogItem[] = [
    { id: '1', datetime: new Date(2026, 0, 10, 14, 32), beneficiaryName: '김순자', type: '낙상 감지', status: 'resolved', manager: '박간호사', summary: '거실에서 낙상 감지됨. 즉시 방문하여 확인 결과 경미한 타박상. 보호자 연락 완료.' },
    { id: '2', datetime: new Date(2026, 0, 10, 11, 15), beneficiaryName: '박영희', type: '응답 없음', status: 'pending', manager: '', summary: '' },
    { id: '3', datetime: new Date(2026, 0, 9, 16, 48), beneficiaryName: '이철수', type: '이상 발화', status: 'resolved', manager: '김담당', summary: '통화 중 반복적인 혼란 발화 감지. 방문 확인 결과 일시적 혼란 상태. 보호자 상담 진행.' },
];

const STATUS_MAP = {
    resolved: { label: '조치 완료', className: 'status-resolved', icon: CheckCircle2 },
    pending: { label: '대기', className: 'status-pending', icon: Clock },
    error: { label: '오류', className: 'status-error', icon: XCircle },
};

const MANAGER_OPTIONS = ['', '박간호사', '김담당', '이매니저', '최상담사'];

/**
 * EmergencyLog
 *
 * Module with detail view modal for each log entry.
 */
export default function EmergencyLog({
    logs = MOCK_LOGS,
    loading = false,
    onUpdate,
}: EmergencyLogProps) {
    const [detailLog, setDetailLog] = useState<EmergencyLogItem | null>(null);
    const [editManager, setEditManager] = useState('');
    const [editSummary, setEditSummary] = useState('');
    const [copied, setCopied] = useState(false);

    const handleOpenDetail = (log: EmergencyLogItem) => {
        setDetailLog(log);
        setEditManager(log.manager || '');
        setEditSummary(log.summary || '');
        setCopied(false);
    };

    const handleCloseDetail = () => {
        setDetailLog(null);
    };

    const handleSave = () => {
        if (detailLog) {
            onUpdate?.(detailLog.id, { manager: editManager, summary: editSummary });
        }
        handleCloseDetail();
    };

    const generateCopyText = () => {
        if (!detailLog) return '';
        const statusInfo = STATUS_MAP[detailLog.status];
        return `[위급 감지 보고서]
일시: ${formatDateWithHour(detailLog.datetime)}
대상자: ${detailLog.beneficiaryName}
유형: ${detailLog.type}
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
            alert('클립보드 복사에 실패했습니다. (브라우저가 지원하지 않거나 보안 컨텍스트가 아님)');
        }
    };

    return (
        <>
            <Card padding="md" className="emergency-log-card">
                {/* Module Header */}
                <div className="emergency-log-module-header">
                    <AlertTriangle size={26} className="emergency-log-module-icon" />
                    <h3 className="emergency-log-module-title">위급 감지</h3>
                    <span className="emergency-log-module-count-badge">{logs.length}건</span>
                </div>

                {/* Table Content */}
                <div className="emergency-log-module-content">
                    {loading ? (
                        <div className="emergency-log-loading">로딩 중...</div>
                    ) : logs.length === 0 ? (
                        <div className="emergency-log-empty">
                            <CheckCircle2 size={32} />
                            <p>오늘 감지된 위급 상황이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="emergency-log-table-wrap">
                            <table className="emergency-log-table emergency-log-table-lg">
                                <thead>
                                    <tr>
                                        <th>일시</th>
                                        <th>대상자</th>
                                        <th>유형</th>
                                        <th>상태</th>
                                        <th>상세정보</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const statusInfo = STATUS_MAP[log.status];
                                        const StatusIcon = statusInfo.icon;
                                        return (
                                            <tr key={log.id}>
                                                <td className="emergency-log-datetime">{formatDateWithHour(log.datetime)}</td>
                                                <td>{log.beneficiaryName}</td>
                                                <td>{log.type}</td>
                                                <td>
                                                    <span className={`emergency-log-status ${statusInfo.className}`}>
                                                        <StatusIcon size={16} />
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="emergency-log-view-btn" onClick={() => handleOpenDetail(log)}>
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

            {/* Detail Modal */}
            {detailLog && (
                <div className="bulletin-overlay" onClick={handleCloseDetail}>
                    <div className="bulletin-dialog emergency-detail-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="bulletin-dialog-header">
                            <h3>위급 감지 상세정보</h3>
                            <button className="bulletin-dialog-close" onClick={handleCloseDetail}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="bulletin-dialog-body">
                            {/* Fixed Fields */}
                            <div className="emergency-detail-grid">
                                <div className="emergency-detail-field">
                                    <span className="emergency-detail-label">일시</span>
                                    <span className="emergency-detail-value">{formatDateWithHour(detailLog.datetime)}</span>
                                </div>
                                <div className="emergency-detail-field">
                                    <span className="emergency-detail-label">대상자</span>
                                    <span className="emergency-detail-value">{detailLog.beneficiaryName}</span>
                                </div>
                                <div className="emergency-detail-field">
                                    <span className="emergency-detail-label">유형</span>
                                    <span className="emergency-detail-value">{detailLog.type}</span>
                                </div>
                                <div className="emergency-detail-field">
                                    <span className="emergency-detail-label">상태</span>
                                    {(() => {
                                        const StatusIcon = STATUS_MAP[detailLog.status].icon;
                                        return (
                                            <span className={`emergency-log-status ${STATUS_MAP[detailLog.status].className}`}>
                                                <StatusIcon size={16} />
                                                {STATUS_MAP[detailLog.status].label}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Editable Fields */}
                            <div className="emergency-detail-editable">
                                <div className="bulletin-dialog-field">
                                    <label className="bulletin-dialog-label">담당자</label>
                                    <select
                                        className="emergency-detail-select"
                                        value={editManager}
                                        onChange={(e) => setEditManager(e.target.value)}
                                    >
                                        <option value="">미지정</option>
                                        {MANAGER_OPTIONS.filter(m => m).map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="bulletin-dialog-field">
                                    <label className="bulletin-dialog-label">요약</label>
                                    <textarea
                                        className="bulletin-dialog-textarea"
                                        placeholder="상황 발생 및 대처 내용을 입력하세요..."
                                        value={editSummary}
                                        onChange={(e) => setEditSummary(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            {/* Copy Button */}
                            <button className="emergency-detail-copy-btn" onClick={handleCopy}>
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? '복사됨!' : '전체 내용 복사'}
                            </button>
                        </div>
                        <div className="bulletin-dialog-footer">
                            <button className="bulletin-dialog-cancel" onClick={handleCloseDetail}>취소</button>
                            <button className="bulletin-dialog-save" onClick={handleSave}>저장</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
