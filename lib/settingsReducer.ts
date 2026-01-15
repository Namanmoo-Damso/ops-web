import type { SettingsState } from './settingsValidation';

export type SettingsAction =
    | { type: 'SET_RETRY_MAX_RETRIES'; payload: number }
    | { type: 'SET_RETRY_INTERVAL'; payload: number }
    | { type: 'SET_RISK_SENSITIVITY'; payload: 1 | 2 | 3 }
    | { type: 'TOGGLE_CONVERSATION_TOPIC'; payload: keyof SettingsState['conversationTopics'] }
    | { type: 'SET_SCHEDULED_START_TIME'; payload: string }
    | { type: 'SET_SCHEDULED_END_TIME'; payload: string }
    | { type: 'RESET_SETTINGS'; payload: SettingsState }
    | { type: 'LOAD_SETTINGS'; payload: SettingsState };

/**
 * Reducer for managing settings state
 */
export function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
    switch (action.type) {
        case 'SET_RETRY_MAX_RETRIES':
            return {
                ...state,
                retryPolicy: {
                    ...state.retryPolicy,
                    maxRetries: action.payload,
                },
            };

        case 'SET_RETRY_INTERVAL':
            return {
                ...state,
                retryPolicy: {
                    ...state.retryPolicy,
                    retryInterval: action.payload,
                },
            };

        case 'SET_RISK_SENSITIVITY':
            return {
                ...state,
                riskDetection: {
                    sensitivity: action.payload,
                },
            };

        case 'TOGGLE_CONVERSATION_TOPIC':
            return {
                ...state,
                conversationTopics: {
                    ...state.conversationTopics,
                    [action.payload]: !state.conversationTopics[action.payload],
                },
            };

        case 'SET_SCHEDULED_START_TIME':
            return {
                ...state,
                scheduledCalls: {
                    ...state.scheduledCalls,
                    preferredStartTime: action.payload,
                },
            };

        case 'SET_SCHEDULED_END_TIME':
            return {
                ...state,
                scheduledCalls: {
                    ...state.scheduledCalls,
                    preferredEndTime: action.payload,
                },
            };

        case 'RESET_SETTINGS':
        case 'LOAD_SETTINGS':
            return action.payload;

        default:
            return state;
    }
}
