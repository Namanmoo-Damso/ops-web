/**
 * UI 유틸리티 함수
 */

/**
 * 여러 className을 하나로 합치고 공백 정규화
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim()
    .replace(/\s+/g, ' ');
}
