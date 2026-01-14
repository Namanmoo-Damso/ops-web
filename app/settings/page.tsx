'use client';

import { useReducer, useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Slider from '../../components/ui/Slider';
import Switch from '../../components/ui/Switch';
import TimePicker from '../../components/ui/TimePicker';
import Button from '../../components/ui/Button';
import Toast, { type ToastType } from '../../components/ui/Toast';
import { Phone, Activity, MessageCircle, Bell, Clock, History, AlertTriangle } from 'lucide-react';
import { settingsReducer } from '../../lib/settingsReducer';
import { DEFAULT_SETTINGS, validateSettings, areSettingsEqual, type SettingsState } from '../../lib/settingsValidation';
import { SENSITIVITY_DESCRIPTIONS } from '../../lib/sensitivityConfig';

export default function SettingsPage() {
    const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS);
    const [savedSettings, setSavedSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
        isOpen: false,
        message: '',
        type: 'info',
    });

    const hasUnsavedChanges = !areSettingsEqual(settings, savedSettings);
    const isInitialMount = useRef(true);

    // Show toast notification
    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ isOpen: true, message, type });
    }, []);

    // Warn user about unsaved changes before leaving
    useEffect(() => {
        // Skip on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Save settings
    const handleSave = async () => {
        // Validate settings
        const validationErrors = validateSettings(settings);
        if (validationErrors.length > 0) {
            showToast(validationErrors[0].message, 'error');
            return;
        }

        setIsSaving(true);
        try {
            // TODO: API call to save settings
            // await apiClient.put('/v1/admin/settings', settings);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSavedSettings(settings);
            showToast('설정이 성공적으로 저장되었습니다.', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            const errorMessage = error instanceof Error ? error.message : '설정 저장 중 오류가 발생했습니다.';
            showToast(errorMessage, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const currentSensitivityInfo = SENSITIVITY_DESCRIPTIONS[settings.riskDetection.sensitivity];

    return (
        <DashboardLayout>
            <div className="settings-container">

                {/* Section 1: Scheduled Call Times */}
                <Card padding="lg" className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">전화 서비스 제공 시간대 설정</h2>
                            <p className="settings-section-description">
                                전화 서비스가 운영되는 시간대를 설정합니다
                            </p>
                        </div>
                    </div>

                    <div className="settings-form-row">
                        <TimePicker
                            label="시작 시간"
                            value={settings.scheduledCalls.preferredStartTime}
                            onChange={(value) => dispatch({ type: 'SET_SCHEDULED_START_TIME', payload: value })}
                            fullWidth
                        />
                        <TimePicker
                            label="종료 시간"
                            value={settings.scheduledCalls.preferredEndTime}
                            onChange={(value) => dispatch({ type: 'SET_SCHEDULED_END_TIME', payload: value })}
                            fullWidth
                        />
                    </div>
                </Card>

                {/* Section 2: Retry Policy */}
                <Card padding="lg" className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <Phone size={24} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">부재중 재시도 정책</h2>
                            <p className="settings-section-description">
                                대상자와 연락이 닿지 않을 때 자동 재시도 설정
                            </p>
                        </div>
                    </div>

                    <div className="settings-form-row">
                        <Select
                            label="최대 재시도 횟수"
                            value={settings.retryPolicy.maxRetries}
                            onChange={(value) =>
                                dispatch({ type: 'SET_RETRY_MAX_RETRIES', payload: Number(value) })
                            }
                            options={[
                                { value: 1, label: '1회 재시도' },
                                { value: 2, label: '2회 재시도' },
                                { value: 3, label: '3회 재시도' },
                                { value: 4, label: '4회 재시도' },
                                { value: 5, label: '5회 재시도' },
                            ]}
                            fullWidth
                        />

                        <Select
                            label="재시도 간격"
                            value={settings.retryPolicy.retryInterval}
                            onChange={(value) =>
                                dispatch({ type: 'SET_RETRY_INTERVAL', payload: Number(value) })
                            }
                            options={[
                                { value: 10, label: '10분 후' },
                                { value: 30, label: '30분 후' },
                                { value: 60, label: '1시간 후' },
                                { value: 120, label: '2시간 후' },
                            ]}
                            fullWidth
                        />
                    </div>

                    <div className="settings-warning-banner">
                        <div className="settings-warning-icon">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="settings-warning-content">
                            <div className="settings-warning-text">
                                설정된 횟수만큼 재시도 후에도 연락이 닿지 않으면 담당자에게 부재중 알림이 발송됩니다.
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Section 3: AI Risk Detection Sensitivity */}
                <Card padding="lg" className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">AI 위험 감지 민감도</h2>
                            <p className="settings-section-description">
                                통화 중 위험 신호를 감지하는 민감도를 조절합니다
                            </p>
                        </div>
                    </div>

                    <Slider
                        value={settings.riskDetection.sensitivity}
                        onChange={(value) =>
                            dispatch({ type: 'SET_RISK_SENSITIVITY', payload: value as 1 | 2 | 3 })
                        }
                        min={1}
                        max={3}
                        step={1}
                        labels={['둔감', '보통', '민감']}
                        aria-label="위험 감지 민감도"
                    />

                    <div className="settings-sensitivity-levels">
                        <div className="settings-sensitivity-description">
                            <h4>{currentSensitivityInfo.title}</h4>
                            <p>{currentSensitivityInfo.description}</p>
                            <div className="settings-sensitivity-examples">
                                <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                                    감지 예시:
                                </strong>
                                {currentSensitivityInfo.examples.map((example, index) => (
                                    <div key={index} className="settings-sensitivity-example">
                                        <span className="settings-sensitivity-example-icon">💬</span>
                                        <span>"{example}"</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Section 4: Conversation Topics */}
                <Card padding="lg" className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">대화 주제 설정</h2>
                            <p className="settings-section-description">
                                AI가 안부 전화 시 확인할 항목을 선택합니다
                            </p>
                        </div>
                    </div>

                    <div className="settings-topic-list">
                        <div className="settings-topic-item">
                            <div className="settings-topic-info">
                                <div className="settings-topic-label">건강 상태 확인</div>
                                <div className="settings-topic-description">
                                    몸 상태가 어떤지, 불편한 곳은 없는지 확인합니다
                                </div>
                            </div>
                            <Switch
                                checked={settings.conversationTopics.healthCheck}
                                onChange={() =>
                                    dispatch({ type: 'TOGGLE_CONVERSATION_TOPIC', payload: 'healthCheck' })
                                }
                                aria-label="건강 상태 확인"
                            />
                        </div>

                        <div className="settings-topic-item">
                            <div className="settings-topic-info">
                                <div className="settings-topic-label">식사 여부 확인</div>
                                <div className="settings-topic-description">
                                    오늘 식사를 제대로 하셨는지 확인합니다
                                </div>
                            </div>
                            <Switch
                                checked={settings.conversationTopics.mealCheck}
                                onChange={() => dispatch({ type: 'TOGGLE_CONVERSATION_TOPIC', payload: 'mealCheck' })}
                                aria-label="식사 여부 확인"
                            />
                        </div>

                        <div className="settings-topic-item">
                            <div className="settings-topic-info">
                                <div className="settings-topic-label">약 복용 체크</div>
                                <div className="settings-topic-description">
                                    처방받은 약을 제때 드셨는지 확인합니다
                                </div>
                            </div>
                            <Switch
                                checked={settings.conversationTopics.medicationCheck}
                                onChange={() => dispatch({ type: 'TOGGLE_CONVERSATION_TOPIC', payload: 'medicationCheck' })}
                                aria-label="약 복용 체크"
                            />
                        </div>

                        <div className="settings-topic-item">
                            <div className="settings-topic-info">
                                <div className="settings-topic-label">수면 패턴 확인</div>
                                <div className="settings-topic-description">
                                    어젯밤 잘 주무셨는지 확인합니다
                                </div>
                            </div>
                            <Switch
                                checked={settings.conversationTopics.sleepCheck}
                                onChange={() => dispatch({ type: 'TOGGLE_CONVERSATION_TOPIC', payload: 'sleepCheck' })}
                                aria-label="수면 패턴 확인"
                            />
                        </div>

                        <div className="settings-topic-item">
                            <div className="settings-topic-info">
                                <div className="settings-topic-label">기분 상태 확인</div>
                                <div className="settings-topic-description">
                                    오늘 기분이 어떤지, 외로우시진 않은지 확인합니다
                                </div>
                            </div>
                            <Switch
                                checked={settings.conversationTopics.moodCheck}
                                onChange={() => dispatch({ type: 'TOGGLE_CONVERSATION_TOPIC', payload: 'moodCheck' })}
                                aria-label="기분 상태 확인"
                            />
                        </div>
                    </div>
                </Card>

                {/* Section 5: Change History */}
                <Card padding="lg" className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <History size={24} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">설정 변경 이력</h2>
                        </div>
                    </div>

                    <table className="settings-history-table">
                        <thead>
                            <tr>
                                <th>변경 일시</th>
                                <th>변경자</th>
                                <th>변경 항목</th>
                                <th>변경 내용</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2026-01-10 14:32</td>
                                <td>관리자 (admin@sodam.store)</td>
                                <td>위험 감지 민감도</td>
                                <td>보통 → 민감</td>
                            </tr>
                            <tr>
                                <td>2026-01-09 10:15</td>
                                <td>관리자 (admin@sodam.store)</td>
                                <td>재시도 횟수</td>
                                <td>2회 → 3회</td>
                            </tr>
                            <tr>
                                <td>2026-01-08 16:45</td>
                                <td>관리자 (admin@sodam.store)</td>
                                <td>대화 주제</td>
                                <td>수면 패턴 확인 활성화</td>
                            </tr>
                        </tbody>
                    </table>
                </Card>

                {/* Save Button */}
                <div className="settings-save-container">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSave}
                        loading={isSaving}
                        className="settings-save-button"
                        style={{
                            minWidth: '300px',
                            height: '48px',
                            fontWeight: 'var(--font-weight-bold)',
                        }}
                    >
                        {isSaving ? '저장 중...' : '설정 저장하기'}
                    </Button>
                </div>

                {/* Unsaved changes indicator */}
                {hasUnsavedChanges && (
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '100px',
                            right: '24px',
                            padding: '12px 16px',
                            backgroundColor: 'var(--color-warning-light)',
                            border: '1px solid var(--color-warning-main)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: 'var(--color-text-primary)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                        }}
                    >
                        ⚠️ 저장하지 않은 변경사항이 있습니다
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                isOpen={toast.isOpen}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </DashboardLayout>
    );
}
