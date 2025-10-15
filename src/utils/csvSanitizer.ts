/**
 * Sanitizes CSV field to prevent formula injection attacks
 * @param value - The value to sanitize
 * @returns Sanitized value safe for CSV export
 */
export const sanitizeCsvField = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the field starts with dangerous characters, prepend with single quote
  if (/^[=@+-]/.test(stringValue)) {
    return `'${stringValue}`;
  }
  
  // Escape double quotes by doubling them
  return stringValue.replace(/"/g, '""');
};

/**
 * Converts array of objects to CSV string with security sanitization
 * @param data - Array of objects to convert
 * @param headers - Array of header names (object keys to include)
 * @returns CSV string with sanitized values
 */
export const sanitizeDataToCsv = <T extends Record<string, any>>(
  data: T[],
  headers: (keyof T)[]
): string => {
  if (!data.length) return '';
  
  // Create header row
  const headerRow = headers.map(header => `"${sanitizeCsvField(String(header))}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(row => 
    headers.map(header => `"${sanitizeCsvField(row[header])}"`).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Downloads CSV data as a file with security sanitization
 * @param data - Array of objects to export
 * @param headers - Array of header names
 * @param filename - Name of the file to download
 */
export const downloadSanitizedCsv = <T extends Record<string, unknown>>(
  data: T[],
  headers: (keyof T)[],
  filename: string
): void => {
  const csvContent = sanitizeDataToCsv(data, headers);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};