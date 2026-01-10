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
