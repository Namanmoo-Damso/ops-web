export interface ValidationError {
    field: string;
    message: string;
}

export interface SettingsState {
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
    scheduledCalls: {
        preferredStartTime: string;
        preferredEndTime: string;
    };
}

export const DEFAULT_SETTINGS: SettingsState = {
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
    scheduledCalls: {
        preferredStartTime: '09:00',
        preferredEndTime: '18:00',
    },
};

/**
 * Validates settings before saving
 */
export function validateSettings(settings: SettingsState): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate retry policy
    if (settings.retryPolicy.maxRetries < 1 || settings.retryPolicy.maxRetries > 10) {
        errors.push({
            field: 'retryPolicy.maxRetries',
            message: '재시도 횟수는 1회에서 10회 사이여야 합니다.',
        });
    }

    if (settings.retryPolicy.retryInterval < 5 || settings.retryPolicy.retryInterval > 240) {
        errors.push({
            field: 'retryPolicy.retryInterval',
            message: '재시도 간격은 5분에서 240분 사이여야 합니다.',
        });
    }

    // Validate risk detection sensitivity
    if (![1, 2, 3].includes(settings.riskDetection.sensitivity)) {
        errors.push({
            field: 'riskDetection.sensitivity',
            message: '민감도는 1, 2, 3 중 하나여야 합니다.',
        });
    }

    // Validate at least one conversation topic is selected
    const hasAtLeastOneTopic = Object.values(settings.conversationTopics).some(v => v === true);
    if (!hasAtLeastOneTopic) {
        errors.push({
            field: 'conversationTopics',
            message: '최소 하나의 대화 주제를 선택해야 합니다.',
        });
    }



    // Validate scheduled call times
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(settings.scheduledCalls.preferredStartTime)) {
        errors.push({
            field: 'scheduledCalls.preferredStartTime',
            message: '시작 시간 형식이 올바르지 않습니다 (HH:mm).',
        });
    }

    if (!timeRegex.test(settings.scheduledCalls.preferredEndTime)) {
        errors.push({
            field: 'scheduledCalls.preferredEndTime',
            message: '종료 시간 형식이 올바르지 않습니다 (HH:mm).',
        });
    }

    // Validate end time is after start time
    if (
        timeRegex.test(settings.scheduledCalls.preferredStartTime) &&
        timeRegex.test(settings.scheduledCalls.preferredEndTime)
    ) {
        const [startHour, startMin] = settings.scheduledCalls.preferredStartTime.split(':').map(Number);
        const [endHour, endMin] = settings.scheduledCalls.preferredEndTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (endMinutes <= startMinutes) {
            errors.push({
                field: 'scheduledCalls',
                message: '종료 시간은 시작 시간보다 늦어야 합니다.',
            });
        }
    }

    return errors;
}

/**
 * Compares two settings objects for equality
 */
export function areSettingsEqual(a: SettingsState, b: SettingsState): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}
