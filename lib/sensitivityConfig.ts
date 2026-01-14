export interface SensitivityLevel {
    title: string;
    description: string;
    examples: string[];
}

export type SensitivityConfig = {
    readonly [K in 1 | 2 | 3]: SensitivityLevel;
};

export const SENSITIVITY_DESCRIPTIONS: SensitivityConfig = {
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
} as const;
