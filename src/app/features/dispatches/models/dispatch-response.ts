/** Resultados que permiten actualizar inventario y registrar un movimiento. */
export type AuthorizedDispatchResult = 'APROBADO' | 'APROBADO_CON_ALERTA';

export type DispatchResult = AuthorizedDispatchResult | 'RECHAZADO' | 'PRODUCTO_INEXISTENTE';

interface DispatchResponseBase {
  readonly resultado: DispatchResult;
  readonly mensaje: string;
}

export interface AuthorizedDispatchResponse extends DispatchResponseBase {
  readonly resultado: AuthorizedDispatchResult;
  readonly existencias_anteriores: number;
  readonly saldo: number;
  readonly minimo: number;
}

/** Make puede incluir el cálculo que explica el rechazo, sin crear un movimiento. */
export interface RejectedDispatchResponse extends DispatchResponseBase {
  readonly resultado: 'RECHAZADO';
  readonly existencias_anteriores?: number;
  readonly saldo?: number;
  readonly minimo?: number;
}

export interface ProductNotFoundResponse extends DispatchResponseBase {
  readonly resultado: 'PRODUCTO_INEXISTENTE';
}

/** El campo resultado permite distinguir y tratar cada respuesta de Make. */
export type DispatchResponse =
  AuthorizedDispatchResponse | RejectedDispatchResponse | ProductNotFoundResponse;
