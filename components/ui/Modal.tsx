import { HTMLAttributes, ReactNode, forwardRef, useEffect, useCallback, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './utils';

/**
 * Modal Component
 *
 * shadcn/ui 패턴 준수: forwardRef, variant props, cn() 유틸리티, displayName
 * DESIGN_GUIDE_V2 준수:
 * - 최대 폭: 1000~1200px
 * - 배경: 크림톤 (#FBFDF9)
 * - 라벨/값: 라벨 16px, 값 18~19px
 */

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  description?: string;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      size = 'md',
      title,
      description,
      footer,
      closeOnOverlayClick = true,
      closeOnEsc = true,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const descriptionId = useId();

    // ESC 키 핸들러
    const handleEscape = useCallback(
      (e: KeyboardEvent) => {
        if (closeOnEsc && e.key === 'Escape') {
          onClose();
        }
      },
      [closeOnEsc, onClose],
    );

    // Focus trap 및 초기 포커스
    useEffect(() => {
      if (open && modalRef.current) {
        // 이전 포커스 요소 저장
        const previouslyFocused = document.activeElement as HTMLElement;

        // 모달 내 포커스 가능한 요소들
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // 첫 번째 요소에 포커스
        firstElement?.focus();

        // Tab 키 focus trap
        const handleTab = (e: KeyboardEvent) => {
          if (e.key !== 'Tab') return;

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        };

        document.addEventListener('keydown', handleTab);

        return () => {
          document.removeEventListener('keydown', handleTab);
          // 모달 닫힐 때 이전 포커스 복원
          previouslyFocused?.focus();
        };
      }
    }, [open]);

    // ESC 키 리스너 등록
    useEffect(() => {
      if (open) {
        document.addEventListener('keydown', handleEscape);
        // Body 스크롤 방지
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }, [open, handleEscape]);

    // 오버레이 클릭 핸들러
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    if (!open) return null;

    const sizeStyles: Record<ModalSize, string> = {
      sm: 'max-w-[600px]',   // DESIGN_GUIDE_V2
      md: 'max-w-[800px]',
      lg: 'max-w-[1000px]',
      xl: 'max-w-[1200px]',  // DESIGN_GUIDE_V2 최대
    };

    const overlayStyles = cn(
      'fixed inset-0 z-50',
      'bg-black/50',
      'flex items-center justify-center',
      'p-4',
      'animate-in fade-in duration-200',
    );

    const modalStyles = cn(
      'relative w-full',
      'bg-[#FBFDF9]',  // DESIGN_GUIDE_V2 크림톤
      'rounded-3xl',   // 24px radius
      'shadow-2xl',
      'animate-in zoom-in-95 duration-200',
      sizeStyles[size],
      className,
    );

    const headerStyles = cn(
      'px-6 pt-6 pb-4',
      'border-b border-[var(--color-border)]',
    );

    const bodyStyles = cn(
      'px-6 py-6',
      'max-h-[calc(100vh-200px)]',
      'overflow-y-auto',
    );

    const footerStyles = cn(
      'px-6 pb-6 pt-4',
      'border-t border-[var(--color-border)]',
      'flex items-center justify-end gap-3',
    );

    const modalContent = (
      <div
        className={overlayStyles}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div ref={modalRef} className={modalStyles} {...props}>
          {/* Header */}
          {(title || description) && (
            <div className={headerStyles}>
              {title && (
                <h2
                  id={titleId}
                  className="text-2xl font-black text-[var(--color-text-primary)]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descriptionId}
                  className="mt-2 text-sm text-[var(--color-text-muted)]"
                >
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Body */}
          <div className={bodyStyles}>{children}</div>

          {/* Footer */}
          {footer && <div className={footerStyles}>{footer}</div>}
        </div>
      </div>
    );

    // Portal을 사용하여 body에 직접 렌더링
    if (typeof window === 'undefined') return null;
    return createPortal(modalContent, document.body);
  },
);

Modal.displayName = 'Modal';

export default Modal;
