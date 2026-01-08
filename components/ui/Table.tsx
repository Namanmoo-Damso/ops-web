import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from './utils';

/**
 * Table Component
 *
 * shadcn/ui 패턴 준수: forwardRef, cn() 유틸리티, displayName
 * DESIGN_GUIDE_V2 준수:
 * - Body 16px 기본
 * - 명확한 border
 */

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hoverable?: boolean;
}

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}
export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
}
export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ striped = false, hoverable = true, className = '', children, ...props }, ref) => {
    const tableStyles = cn(
      'w-full',
      'border-collapse',
      'text-base',  // DESIGN_GUIDE_V2: 16px body
      className,
    );

    return (
      <div className="w-full overflow-x-auto">
        <table ref={ref} className={tableStyles} {...props}>
          {children}
        </table>
      </div>
    );
  },
);

Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className = '', children, ...props }, ref) => {
    const headerStyles = cn(
      'border-b border-[var(--color-border)]',
      'bg-[var(--color-bg-elevated-1)]',
      className,
    );

    return (
      <thead ref={ref} className={headerStyles} {...props}>
        {children}
      </thead>
    );
  },
);

TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={className} {...props}>
        {children}
      </tbody>
    );
  },
);

TableBody.displayName = 'TableBody';

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ selected = false, className = '', children, ...props }, ref) => {
    const rowStyles = cn(
      'border-b border-[var(--color-border)]',
      'transition-colors duration-150',
      'hover:bg-[var(--color-bg-elevated-1)]',
      selected && 'bg-[var(--color-primary-light)]/20',
      className,
    );

    return (
      <tr ref={ref} className={rowStyles} {...props}>
        {children}
      </tr>
    );
  },
);

TableRow.displayName = 'TableRow';

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    {
      sortable = false,
      sorted = false,
      onSort,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const headStyles = cn(
      'px-4 py-3',
      'text-left',
      'font-semibold',  // DESIGN_GUIDE_V2
      'text-[var(--color-text-primary)]',
      sortable && 'cursor-pointer select-none hover:bg-[var(--color-bg-elevated-2)]',
      className,
    );

    const handleClick = () => {
      if (sortable && onSort) {
        onSort();
      }
    };

    return (
      <th
        ref={ref}
        className={headStyles}
        onClick={handleClick}
        aria-sort={
          sorted === 'asc'
            ? 'ascending'
            : sorted === 'desc'
              ? 'descending'
              : undefined
        }
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          {sortable && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
            </span>
          )}
        </div>
      </th>
    );
  },
);

TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = '', children, ...props }, ref) => {
    const cellStyles = cn(
      'px-4 py-3',
      'text-[var(--color-text-primary)]',
      className,
    );

    return (
      <td ref={ref} className={cellStyles} {...props}>
        {children}
      </td>
    );
  },
);

TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export default Table;
