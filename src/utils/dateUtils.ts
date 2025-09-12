// Date utility functions to handle timezone issues consistently across the application

/**
 * Formats a Date object to YYYY-MM-DD string using local timezone components
 * This prevents the -1 day issue caused by toISOString() UTC conversion
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string to a Date object in local timezone
 * This ensures consistent date parsing without timezone shifts
 */
export function parseDateFromYYYYMMDD(dateString: string): Date {
  if (!dateString) return new Date();
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a date string for display in forms (handles null/undefined)
 */
export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Parse and reformat to ensure consistency
  const date = new Date(dateString);
  return formatDateToYYYYMMDD(date);
}

/**
 * Formats a date for display in tables (Brazilian format)
 */
export function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  const date = parseDateFromYYYYMMDD(dateString);
  return date.toLocaleDateString('pt-BR');
}