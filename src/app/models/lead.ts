export interface Concepto { id: number; nombre: string; activo?: boolean; }
export interface Estado   { id: number; nombre: string; activo?: boolean; }
export interface Lead {
  id?: number;
  usuario_id: number;
  fecha_de_entrada: string;
  empresa?: string | null;
  nombre?: string | null;
  web?: string | null;
  correo?: string | null;
  telefono?: string | null;
  fuente?: string | null;
  propietario_relaccion?: string | null;
  notas?: string | null;
  concepto_id?: number | null;
  estado_id?: number | null;
  ciudad?: string | null;
  negocio?: string | null;

  // opcional: cuando el backend envía asociaciones
  concepto?: Concepto | null;
  estado?: Estado | null;

  // denormalizados opcionales
  concepto_nombre?: string | null;
  estado_nombre?: string | null;
}