/**
 * @file Loading skeleton components
 * @description Reusable skeleton components for loading states in admin interface
 * @module components/admin/Skeletons
 */

/**
 * Card skeleton component for dashboard cards
 * Displays animated placeholder for loading card content
 *
 * @returns {JSX.Element} Skeleton card component
 *
 * @example
 * <CardSkeleton />
 */
export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white shadow rounded-lg p-6">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

/**
 * Table skeleton component for data tables
 * Displays 5 animated placeholder rows
 *
 * @param {Object} [props] - Component props
 * @param {number} [props.rows=5] - Number of skeleton rows to display
 *
 * @returns {JSX.Element} Skeleton table component
 *
 * @example
 * <TableSkeleton rows={3} />
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-gray-200 py-4">
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Chart skeleton component for analytics charts
 * Displays animated placeholder for chart loading states
 *
 * @param {Object} [props] - Component props
 * @param {number} [props.height=256] - Height of skeleton in pixels
 *
 * @returns {JSX.Element} Skeleton chart component
 *
 * @example
 * <ChartSkeleton height={320} />
 */
export function ChartSkeleton({ height = 256 }: { height?: number }) {
  return (
    <div className="animate-pulse bg-white shadow rounded-lg p-6">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div
        className="bg-gray-100 rounded"
        style={{ height: `${height}px` }}
      ></div>
    </div>
  );
}

/**
 * List skeleton component for vertical lists
 * Displays animated placeholder for list items
 *
 * @param {Object} [props] - Component props
 * @param {number} [props.items=3] - Number of skeleton items to display
 *
 * @returns {JSX.Element} Skeleton list component
 *
 * @example
 * <ListSkeleton items={5} />
 */
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Form skeleton component for form loading states
 * Displays animated placeholder for form fields
 *
 * @param {Object} [props] - Component props
 * @param {number} [props.fields=4] - Number of skeleton fields to display
 *
 * @returns {JSX.Element} Skeleton form component
 *
 * @example
 * <FormSkeleton fields={6} />
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="animate-pulse space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-100 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}
