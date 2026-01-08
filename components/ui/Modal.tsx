import { HTMLAttributes, ReactNode, forwardRef, useEffect, useCallback } from 'react';
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
    // ESC 키 핸들러
    const handleEscape = useCallback(
      (e: KeyboardEvent) => {
        if (closeOnEsc && e.key === 'Escape') {
          onClose();
        }
      },
      [closeOnEsc, onClose],
    );

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

    return (
      <div
        className={overlayStyles}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <div ref={ref} className={modalStyles} {...props}>
          {/* Header */}
          {(title || description) && (
            <div className={headerStyles}>
              {title && (
                <h2
                  id="modal-title"
                  className="text-2xl font-black text-[var(--color-text-primary)]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
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
  },
);

Modal.displayName = 'Modal';

export default Modal;
