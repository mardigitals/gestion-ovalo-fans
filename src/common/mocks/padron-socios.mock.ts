export interface SocioClubMock {
  dni: string;
  nro_socio: string;
  nombre_completo: string;
  estado_cuota: 'AL_DIA' | 'MOROSO' | 'BAJA';
}

export const PADRON_SOCIOS_AR: SocioClubMock[] = [
  { dni: '35111222', nro_socio: '10450', nombre_completo: 'Juan Pérez', estado_cuota: 'AL_DIA' },
  { dni: '38222333', nro_socio: '12890', nombre_completo: 'Lucía Gómez', estado_cuota: 'AL_DIA' },
  { dni: '40333444', nro_socio: '15320', nombre_completo: 'Carlos Ferrero', estado_cuota: 'MOROSO' }, // Prueba de rechazo por mora
  { dni: '32444555', nro_socio: '08910', nombre_completo: 'Martín Castellano', estado_cuota: 'AL_DIA' },
  { dni: '42555666', nro_socio: '18200', nombre_completo: 'Sofía Peralta', estado_cuota: 'AL_DIA' },
  { dni: '29666777', nro_socio: '05412', nombre_completo: 'Diego Lorenzatti', estado_cuota: 'BAJA' }, // Prueba de rechazo por baja
  { dni: '36777888', nro_socio: '11234', nombre_completo: 'Valentina Rossi', estado_cuota: 'AL_DIA' },
  { dni: '41888999', nro_socio: '17654', nombre_completo: 'Mateo Nicola', estado_cuota: 'AL_DIA' },
  { dni: '33999000', nro_socio: '09876', nombre_completo: 'Camila Boschetto', estado_cuota: 'AL_DIA' },
  { dni: '44000111', nro_socio: '19999', nombre_completo: 'Nicolás Bauducco', estado_cuota: 'AL_DIA' },
];

/**
 * Función helper para verificar si un DNI pertenece a un socio activo y al día
 */
export function verificarSocioAlDia(dni: string): { valido: boolean; motivo?: string; socio?: SocioClubMock } {
  const dniLimpio = dni.trim().replace(/\./g, '');
  const socio = PADRON_SOCIOS_AR.find((s) => s.dni === dniLimpio);

  if (!socio) {
    return { valido: false, motivo: 'El DNI ingresado no figura en el padrón de socios de Atlético de Rafaela.' };
  }

  if (socio.estado_cuota !== 'AL_DIA') {
    return { 
      valido: false, 
      motivo: `Tu estado de socio en el club figura como "${socio.estado_cuota}". Regularizá tu situación en secretaría o registrate sin tildar la opción de socio.` 
    };
  }

  return { valido: true, socio };
}