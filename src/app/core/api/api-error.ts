import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

export type ApiErrorKind = 'configuration' | 'connection' | 'timeout' | 'http' | 'invalid-response';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof TimeoutError) {
    return new ApiError(
      'timeout',
      'No recibimos una respuesta a tiempo. Verifica el resultado antes de volver a enviar la solicitud.',
    );
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return new ApiError(
        'connection',
        'No fue posible recibir la respuesta. Revisa la conexión y verifica el resultado antes de reenviar.',
      );
    }
    if (error.status >= 200 && error.status < 300) {
      return new ApiError('invalid-response', 'El servicio no devolvió una respuesta JSON válida.');
    }
    return new ApiError('http', `El servicio respondió con un error HTTP (${error.status}).`);
  }
  return new ApiError('invalid-response', 'No fue posible interpretar la respuesta del servicio.');
}

export function requireEndpoint(url: string): string {
  try {
    const endpoint = new URL(url);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error();
    return url;
  } catch {
    throw new ApiError(
      'configuration',
      'La dirección HTTPS del servicio no está configurada correctamente.',
    );
  }
}
