import { HTMLAttributes, TdHTMLAttributes, forwardRef } from 'react';
import { cn } from './utils';

/**
 * Table Component
 *
 * shadcn/ui 패턴 준수: forwardRef, cn() 유틸리티, displayName
 * DESIGN_GUIDE_V2 준수:
 * - Body 16px 기본
 * - 명확한 border
 */

export interface TableProps extends HTMLAttributes<HTMLTableElement> { }

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> { }
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> { }
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}
export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
}
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> { }

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div className="ui-table-container">
        <table ref={ref} className={cn('ui-table', className)} {...props}>
          {children}
        </table>
      </div>
    );
  },
);

Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <thead ref={ref} className={cn('ui-table-header', className)} {...props}>
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
    return (
      <tr
        ref={ref}
        className={cn('ui-table-row', selected && 'selected', className)}
        {...props}
      >
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
    const handleClick = () => {
      if (sortable && onSort) {
        onSort();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && sortable && onSort) {
        e.preventDefault();
        onSort();
      }
    };

    return (
      <th
        ref={ref}
        className={cn(
          'ui-table-head',
          sortable && 'sortable',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={sortable ? 0 : undefined}
        role={sortable ? 'button' : undefined}
        aria-sort={
          sorted === 'asc'
            ? 'ascending'
            : sorted === 'desc'
              ? 'descending'
              : undefined
        }
        {...props}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {children}
          {sortable && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }} aria-hidden="true">
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
    return (
      <td ref={ref} className={cn('ui-table-cell', className)} {...props}>
        {children}
      </td>
    );
  },
);

TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export default Table;
