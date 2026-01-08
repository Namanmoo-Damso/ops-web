/**
 * UI 유틸리티 함수
 *
 * shadcn/ui 패턴에서 영감을 받은 className 병합 유틸리티
 */

/**
 * 여러 className을 하나로 합치고 공백 정규화
 *
 * @param classes - 병합할 className들 (undefined, null, false는 자동 필터링)
 * @returns 병합되고 정규화된 className 문자열
 *
 * @example
 * // 기본 사용
 * cn('base-class', 'another-class')
 * // => 'base-class another-class'
 *
 * @example
 * // 조건부 클래스
 * cn('base-class', isActive && 'active-class')
 * // => 'base-class active-class' (isActive가 true일 때)
 *
 * @example
 * // props className과 병합
 * cn('base-class', className)
 * // => 'base-class custom-class'
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim()
    .replace(/\s+/g, ' ');
}
