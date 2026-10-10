export type DispatchReason = 'despacho' | 'traslado entre sedes' | 'avería';

/** Datos enviados desde el formulario al webhook de Make. */
export interface DispatchRequest {
  readonly solicitante: string;
  readonly correo: string;
  readonly codigo_producto: string;
  readonly cantidad: number;
  readonly destino: string;
  readonly motivo: DispatchReason;
}
