import type { DispatchRequest } from '../../dispatches/models/dispatch-request';
import type { AuthorizedDispatchResult } from '../../dispatches/models/dispatch-response';

/** Salida autorizada y persistida; los intentos rechazados no son movimientos. */
export interface Movement extends DispatchRequest {
  readonly id: string;
  /** Fecha y hora ISO 8601 con zona horaria, por ejemplo 2026-10-08T21:00:00-05:00. */
  readonly fecha_hora: string;
  readonly producto: string;
  readonly existencias_anteriores: number;
  readonly saldo: number;
  readonly resultado: AuthorizedDispatchResult;
}
