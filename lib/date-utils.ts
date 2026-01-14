/**
 * Date utility functions
 */

/**
 * Formats a date string to relative time format
 *
 * @param dateString - ISO date string or null
 * @returns Formatted relative time string (e.g., "오전 10시", "3일 전", "2개월 전")
 *
 * @example
 * formatRelativeTime('2024-01-10T10:30:00Z') // "오전 10시" (if today)
 * formatRelativeTime('2024-01-07T10:30:00Z') // "3일 전"
 * formatRelativeTime(null) // "-"
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    // Validate date
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return '-';
    }

    const now = new Date();

    // Check if today (compare normalized dates)
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      // Format as 오전/오후 시간
      const hours = date.getHours();
      const period = hours < 12 ? '오전' : '오후';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      return `${period} ${displayHours}시`;
    }

    // Calculate precise difference
    const diffMs = now.getTime() - date.getTime();

    // Return "-" for future dates
    if (diffMs < 0) {
      return '-';
    }

    // Calculate days difference using normalized dates to avoid DST issues
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '1일 전';
    } else if (diffDays < 30) {
      return `${diffDays}일 전`;
    } else if (diffDays < 365) {
      // Use month difference for more accuracy
      const monthsDiff =
        (now.getFullYear() - date.getFullYear()) * 12 +
        (now.getMonth() - date.getMonth());
      return `${monthsDiff}개월 전`;
    } else {
      // Use year difference for more accuracy
      const yearsDiff = now.getFullYear() - date.getFullYear();
      return `${yearsDiff}년 전`;
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '-';
  }
}

/**
 * Extracts the first Korean consonant (초성) from a name
 *
 * @param name - Korean name string
 * @returns First consonant character (e.g., "ㄱ", "ㄴ") or empty string
 *
 * @example
 * getKoreanConsonant('김철수') // "ㄱ"
 * getKoreanConsonant('이영희') // "ㅇ"
 * getKoreanConsonant('John') // ""
 */
export function getKoreanConsonant(name: string): string {
  if (!name || name.length === 0) return '';

  try {
    const firstChar = name.charAt(0);
    const code = firstChar.charCodeAt(0);

    // Korean unicode range: 0xAC00 (가) ~ 0xD7A3 (힣)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const consonants = [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
        'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
      ];
      // Calculate initial consonant index (초성)
      // 한글 = (초성 × 588) + (중성 × 28) + 종성 + 0xAC00
      const consonantIndex = Math.floor((code - 0xAC00) / 588);

      if (consonantIndex >= 0 && consonantIndex < consonants.length) {
        return consonants[consonantIndex];
      }
    }

    return '';
  } catch (error) {
    console.error('Error extracting Korean consonant:', error);
    return '';
  }
}

/**
 * Standard Korean consonants used for alphabetical navigation
 */
export const KOREAN_CONSONANTS = [
  'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
] as const;

/**
 * Formats a date as "M/D(Day)" (e.g., "1/11(토)")
 *
 * @param dateInput - Date object or string
 * @returns Formatted date string
 */
export function formatDateKorean(dateInput: Date | string = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  return `${month}/${day}(${dayOfWeek})`;
}

/**
 * Formats a date as "D/M(Day) HH시" (e.g., "10/1(금) 14시")
 * Note: The requested format was D/M but standard is usually M/D.
 * Keeping consistent with internal request "d/m(요) hh시".
 *
 * @param dateInput - Date object or string
 * @returns Formatted date-time string
 */
export function formatDateWithHour(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  const hour = date.getHours();
  return `${day}/${month}(${dayOfWeek}) ${hour}시`;
}
/**
 * Constant for inactivity threshold (24 hours in milliseconds)
 */
export const INACTIVITY_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/**
 * Checks if the last update was older than the inactivity threshold (24 hours)
 * @param lastUpdated - Date string
 * @returns true if inactive
 */
export function isInactive(lastUpdated: string): boolean {
  if (!lastUpdated) return true;
  const diff = Date.now() - new Date(lastUpdated).getTime();
  return diff > INACTIVITY_THRESHOLD_MS;
}

/**
 * Formats time ago string for monitoring
 * @param dateStr - Date string
 * @returns formatted string (e.g., "방금 전", "3분 전")
 */
export function getTimeAgo(dateStr: string): string {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}
