/**
 * Formatimi i datave për aplikacion
 */

// Formati bazë: "15 Maj 2026"
export const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  return d.toLocaleDateString('sq-AL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Formati i shkurtër: "15/05/2026"
export const formatShortDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  return d.toLocaleDateString('sq-AL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Formati me orë: "15 Maj 2026, 14:30"
export const formatDateTime = (date: string | Date): string => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  return d.toLocaleDateString('sq-AL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formati i orës: "14:30"
export const formatTime = (date: string | Date): string => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  return d.toLocaleTimeString('sq-AL', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formati relativ: "5 minuta më parë", "2 ditë më parë"
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Tani';
  if (diffMins < 60) return `${diffMins} minutë${diffMins !== 1 ? '' : ''} më parë`;
  if (diffHours < 24) return `${diffHours} orë${diffHours !== 1 ? '' : ''} më parë`;
  if (diffDays < 7) return `${diffDays} ditë${diffDays !== 1 ? '' : ''} më parë`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} javë më parë`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} muaj më parë`;
  return `${Math.floor(diffDays / 365)} vit${Math.floor(diffDays / 365) !== 1 ? 'e' : ''} më parë`;
};

// Kontrollon nëse data është e vonuar
export const isOverdue = (date: string | Date): boolean => {
  if (!date) return false;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  
  return d < new Date();
};

// Llogarit ditët e mbetura
export const getDaysRemaining = (date: string | Date): number => {
  if (!date) return 0;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 0;
  
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};