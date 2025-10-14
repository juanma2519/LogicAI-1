export interface Message {
  mensaje_id: number;
  usuario_id: number;
  contenido: string;
  titulo: string;
  fecha_envio: Date;
  leido: boolean;
}