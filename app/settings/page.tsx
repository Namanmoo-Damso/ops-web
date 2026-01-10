'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Slider from '../../components/ui/Slider';
import Switch from '../../components/ui/Switch';
import TimePicker from '../../components/ui/TimePicker';
import Button from '../../components/ui/Button';
import { Phone, Activity, MessageCircle, Bell, Mic, Clock, History, AlertTriangle } from 'lucide-react';

interface SettingsState {
    retryPolicy: {
        maxRetries: number;
        retryInterval: number;
    };
    riskDetection: {
        sensitivity: 1 | 2 | 3;
    };
    conversationTopics: {
        healthCheck: boolean;
        mealCheck: boolean;
        medicationCheck: boolean;
        sleepCheck: boolean;
        moodCheck: boolean;
    };
    guardianNotifications: {
        autoSMS: boolean;
        emailAlerts: boolean;
    };
    aiVoice: {
        gender: 'female' | 'male';
        tone: 'soft' | 'bright' | 'calm';
        speed: number;
    };
    scheduledCalls: {
        preferredStartTime: string;
        preferredEndTime: string;
    };
}

const SENSITIVITY_DESCRIPTIONS = {
    1: {
        title: '둔감 모드',
        description: '명확한 위험 신호만 감지합니다. 사투리, 추임새, 일상적 감탄사는 무시됩니다.',
        examples: ['살려주세요', '도와주세요', '119'],
    },
    2: {
        title: '보통 모드',
        description: '일반적인 위험 징후를 감지합니다. 약간의 불안감이나 고통 표현도 포착합니다.',
        examples: ['아이고', '힘들어', '아파', '살려주세요'],
    },
    3: {
        title: '민감 모드',
        description: '매우 세밀한 위험 신호까지 감지합니다. 작은 변화도 알림을 발생시킬 수 있습니다.',
        examples: ['아이고야', '에고', '힘들어', '아파', '불안해'],
    },
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsState>({
        retryPolicy: {
            maxRetries: 3,
            retryInterval: 30,
        },
        riskDetection: {
            sensitivity: 2,
        },
        conversationTopics: {
            healthCheck: true,
            mealCheck: true,
            medicationCheck: true,
            sleepCheck: false,
            moodCheck: true,
        },
        guardianNotifications: {
            autoSMS: true,
            emailAlerts: false,
        },
        aiVoice: {
            gender: 'female',
            tone: 'soft',
            speed: 2,
        },
        scheduledCalls: {
            preferredStartTime: '09:00',
            preferredEndTime: '18:00',
        },
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: API call to save settings
            // await apiClient.put('/v1/admin/settings', settings);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('설정이 성공적으로 저장되었습니다.');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('설정 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const currentSensitivityInfo = SENSITIVITY_DESCRIPTIONS[settings.riskDetection.sensitivity];

    return (
        <DashboardLayout title="설정">
            <div className="settings-container">
                {/* Page Header */}
                <div className="settings-header">
                    <h1>설정</h1>
                    <p>AI 통화 및 위기 감지 시스템 설정을 관리합니다.</p>
                </div>

                {/* Section 1: Retry Policy */}
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
                                setSettings({
                                    ...settings,
                                    retryPolicy: { ...settings.retryPolicy, maxRetries: Number(value) },
                                })
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
                                setSettings({
                                    ...settings,
                                    retryPolicy: { ...settings.retryPolicy, retryInterval: Number(value) },
                                })
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
                            <div className="settings-warning-title">긴급 알림 정책</div>
                            <div className="settings-warning-text">
                                설정된 횟수만큼 재시도 후에도 연락이 닿지 않으면, 관리자와 등록된 보호자에게 긴급 알림이 자동으로 발송됩니다.
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Section 2: AI Risk Detection Sensitivity */}
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
                            setSettings({
                                ...settings,
                                riskDetection: { sensitivity: value as 1 | 2 | 3 },
                            })
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

                {/* Section 3: Conversation Topics */}
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
                                onChange={(checked) =>
                                    setSettings({
                                        ...settings,
                                        conversationTopics: { ...settings.conversationTopics, healthCheck: checked },
                                    })
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
                                onChange={(checked) =>
                                    setSettings({
                                        ...settings,
                                        conversationTopics: { ...settings.conversationTopics, mealCheck: checked },
                                    })
                                }
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
                                onChange={(checked) =>
                                    setSettings({
                                        ...settings,
                                        conversationTopics: { ...settings.conversationTopics, medicationCheck: checked },
                                    })
                                }
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
                                onChange={(checked) =>
                                    setSettings({
                                        ...settings,
                                        conversationTopics: { ...settings.conversationTopics, sleepCheck: checked },
                                    })
                                }
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
                                onChange={(checked) =>
                                    setSettings({
                                        ...settings,
                                        conversationTopics: { ...settings.conversationTopics, moodCheck: checked },
                                    })
                                }
                                aria-label="기분 상태 확인"
                            />
                        </div>
                    </div>
                </Card>

                {/* Section 4: Guardian Notifications */}
                <Card padding="lg" className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">보호자 알림 설정</h2>
                            <p className="settings-section-description">
                                위기 상황 발생 시 보호자 알림 방법을 설정합니다
                            </p>
                        </div>
                    </div>

                    <div className="settings-topic-list">
                        <div className="settings-topic-item">
                            <div className="settings-topic-info">
                                <div className="settings-topic-label">위기 상황 자동 문자 발송</div>
                                <div className="settings-topic-description">
                                    위험 신호 감지 시 등록된 보호자에게 즉시 문자를 발송합니다
                                </div>
                            </div>
                            <Switch
                                checked={settings.guardianNotifications.autoSMS}
                                onChange={(checked) =>
                                    setSettings({
                                        ...settings,
                                        guardianNotifications: { ...settings.guardianNotifications, autoSMS: checked },
                                    })
                                }
                                aria-label="위기 상황 자동 문자 발송"
                            />
                        </div>

                        <div className="settings-topic-item">
                            <div className="settings-topic-info">
                                <div className="settings-topic-label">이메일 알림</div>
                                <div className="settings-topic-description">
                                    일일 리포트 및 중요 알림을 이메일로 받습니다
                                </div>
                            </div>
                            <Switch
                                checked={settings.guardianNotifications.emailAlerts}
                                onChange={(checked) =>
                                    setSettings({
                                        ...settings,
                                        guardianNotifications: { ...settings.guardianNotifications, emailAlerts: checked },
                                    })
                                }
                                aria-label="이메일 알림"
                            />
                        </div>
                    </div>
                </Card>

                {/* Section 5: AI Voice and Tone */}
                <Card padding="lg" className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <Mic size={24} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">AI 목소리 및 톤 설정</h2>
                            <p className="settings-section-description">
                                대상자에게 맞는 AI 음성 특성을 설정합니다
                            </p>
                        </div>
                    </div>

                    <div className="settings-form-group">
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: 'var(--font-size-caption)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--color-text-primary)',
                                    marginBottom: 'var(--spacing-md)',
                                }}
                            >
                                목소리 성별
                            </label>
                            <div className="settings-voice-options">
                                <label
                                    className={`settings-voice-option ${
                                        settings.aiVoice.gender === 'female' ? 'selected' : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={settings.aiVoice.gender === 'female'}
                                        onChange={() =>
                                            setSettings({
                                                ...settings,
                                                aiVoice: { ...settings.aiVoice, gender: 'female' },
                                            })
                                        }
                                        className="settings-voice-option-radio"
                                    />
                                    <span className="settings-voice-option-label">여성 목소리</span>
                                </label>
                                <label
                                    className={`settings-voice-option ${
                                        settings.aiVoice.gender === 'male' ? 'selected' : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={settings.aiVoice.gender === 'male'}
                                        onChange={() =>
                                            setSettings({
                                                ...settings,
                                                aiVoice: { ...settings.aiVoice, gender: 'male' },
                                            })
                                        }
                                        className="settings-voice-option-radio"
                                    />
                                    <span className="settings-voice-option-label">남성 목소리</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: 'var(--font-size-caption)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--color-text-primary)',
                                    marginBottom: 'var(--spacing-md)',
                                }}
                            >
                                목소리 톤
                            </label>
                            <div className="settings-voice-options">
                                <label
                                    className={`settings-voice-option ${
                                        settings.aiVoice.tone === 'soft' ? 'selected' : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="tone"
                                        value="soft"
                                        checked={settings.aiVoice.tone === 'soft'}
                                        onChange={() =>
                                            setSettings({
                                                ...settings,
                                                aiVoice: { ...settings.aiVoice, tone: 'soft' },
                                            })
                                        }
                                        className="settings-voice-option-radio"
                                    />
                                    <span className="settings-voice-option-label">부드러운</span>
                                </label>
                                <label
                                    className={`settings-voice-option ${
                                        settings.aiVoice.tone === 'bright' ? 'selected' : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="tone"
                                        value="bright"
                                        checked={settings.aiVoice.tone === 'bright'}
                                        onChange={() =>
                                            setSettings({
                                                ...settings,
                                                aiVoice: { ...settings.aiVoice, tone: 'bright' },
                                            })
                                        }
                                        className="settings-voice-option-radio"
                                    />
                                    <span className="settings-voice-option-label">밝은</span>
                                </label>
                                <label
                                    className={`settings-voice-option ${
                                        settings.aiVoice.tone === 'calm' ? 'selected' : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="tone"
                                        value="calm"
                                        checked={settings.aiVoice.tone === 'calm'}
                                        onChange={() =>
                                            setSettings({
                                                ...settings,
                                                aiVoice: { ...settings.aiVoice, tone: 'calm' },
                                            })
                                        }
                                        className="settings-voice-option-radio"
                                    />
                                    <span className="settings-voice-option-label">차분한</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: 'var(--font-size-caption)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--color-text-primary)',
                                    marginBottom: 'var(--spacing-md)',
                                }}
                            >
                                말하기 속도
                            </label>
                            <Slider
                                value={settings.aiVoice.speed}
                                onChange={(value) =>
                                    setSettings({
                                        ...settings,
                                        aiVoice: { ...settings.aiVoice, speed: value },
                                    })
                                }
                                min={1}
                                max={3}
                                step={1}
                                labels={['느리게', '보통', '빠르게']}
                                aria-label="말하기 속도"
                            />
                        </div>
                    </div>
                </Card>

                {/* Section 6: Scheduled Call Times */}
                <Card padding="lg" className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">예약 전화 집중 시간대</h2>
                            <p className="settings-section-description">
                                시스템 부하를 분산하기 위한 선호 전화 시간대를 설정합니다
                            </p>
                        </div>
                    </div>

                    <div className="settings-form-row">
                        <TimePicker
                            label="시작 시간"
                            value={settings.scheduledCalls.preferredStartTime}
                            onChange={(value) =>
                                setSettings({
                                    ...settings,
                                    scheduledCalls: { ...settings.scheduledCalls, preferredStartTime: value },
                                })
                            }
                            fullWidth
                        />
                        <TimePicker
                            label="종료 시간"
                            value={settings.scheduledCalls.preferredEndTime}
                            onChange={(value) =>
                                setSettings({
                                    ...settings,
                                    scheduledCalls: { ...settings.scheduledCalls, preferredEndTime: value },
                                })
                            }
                            fullWidth
                        />
                    </div>

                    <div
                        style={{
                            marginTop: 'var(--spacing-lg)',
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--color-bg-elevated-1)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-small)',
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        💡 설정된 시간대 내에서 예약 전화가 우선 배치되며, 긴급 상황 시에는 시간대와 관계없이 즉시 전화가 발신됩니다.
                    </div>
                </Card>

                {/* Section 7: Change History */}
                <Card padding="lg" className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <History size={24} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">설정 변경 이력</h2>
                            <p className="settings-section-description">
                                최근 설정 변경 내역을 확인합니다
                            </p>
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
            </div>
        </DashboardLayout>
    );
}
