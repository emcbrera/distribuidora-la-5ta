import { ApiError } from '../../../core/api/api-error';
import { isFiniteNumber, isNonEmptyString, isRecord } from '../../../core/api/json-validation';
import type { DispatchResponse } from './dispatch-response';

export function parseDispatchResponse(value: unknown): DispatchResponse {
  if (!isRecord(value) || !isNonEmptyString(value['mensaje'])) return invalidResponse();
  const mensaje = value['mensaje'];
  const resultado = value['resultado'];
  const existencias_anteriores = value['existencias_anteriores'];
  const saldo = value['saldo'];
  const minimo = value['minimo'];

  if (resultado === 'PRODUCTO_INEXISTENTE') return { resultado, mensaje };

  if (resultado === 'APROBADO' || resultado === 'APROBADO_CON_ALERTA') {
    if (
      !isFiniteNumber(existencias_anteriores) ||
      existencias_anteriores < 0 ||
      !isFiniteNumber(saldo) ||
      saldo < 0 ||
      !isFiniteNumber(minimo) ||
      minimo < 0
    )
      return invalidResponse();
    return { resultado, mensaje, existencias_anteriores, saldo, minimo };
  }

  if (resultado === 'RECHAZADO') {
    if (
      (existencias_anteriores !== undefined &&
        (!isFiniteNumber(existencias_anteriores) || existencias_anteriores < 0)) ||
      (saldo !== undefined && !isFiniteNumber(saldo)) ||
      (minimo !== undefined && (!isFiniteNumber(minimo) || minimo < 0))
    )
      return invalidResponse();
    return {
      resultado,
      mensaje,
      ...(existencias_anteriores !== undefined ? { existencias_anteriores } : {}),
      ...(saldo !== undefined ? { saldo } : {}),
      ...(minimo !== undefined ? { minimo } : {}),
    };
  }
  return invalidResponse();
}

function invalidResponse(): never {
  throw new ApiError('invalid-response', 'La respuesta de Make no cumple el contrato de despacho.');
}
