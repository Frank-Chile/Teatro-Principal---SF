// frontend/src/utils/dateFormatter.js
import { formatInTimeZone } from 'date-fns-tz';
import es from 'date-fns/locale/es';

/**
 * Toma un string de fecha en formato ISO UTC (como el que viene del backend)
 * y lo convierte a un texto legible en la zona horaria local del navegador del usuario.
 * @param {string} utcDateString - El string de fecha en formato ISO UTC.
 * @returns {string} - La fecha formateada en la hora local.
 */
export const formatToLocalTime = (utcDateString) => {
  if (!utcDateString) return 'Fecha no disponible';
  
  try {
    // Obtiene la zona horaria del navegador del usuario (ej. "America/Lima")
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Formatea la fecha UTC en la zona horaria detectada, con formato en español.
    // Formato de salida: "22 de junio de 2025, 2:15 a. m."
    return formatInTimeZone(utcDateString, timeZone, 'PPPP p', { locale: es });

  } catch (error) {
    console.error("Error formateando la fecha:", error);
    return "Fecha inválida";
  }
};