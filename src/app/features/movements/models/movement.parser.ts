import { ApiError } from '../../../core/api/api-error';
import { isFiniteNumber, isNonEmptyString, isRecord } from '../../../core/api/json-validation';
import type { Movement } from './movement';

/** El webhook de consulta devuelve un objeto con la propiedad movimientos. */
export function parseMovementsResponse(value: unknown): readonly Movement[] {
  if (!isRecord(value) || !Array.isArray(value['movimientos'])) return invalidResponse();
  return value['movimientos'].map(parseMovement);
}

function parseMovement(value: unknown): Movement {
  if (!isRecord(value)) return invalidResponse();
  const {
    id,
    fecha_hora,
    solicitante,
    correo,
    codigo_producto,
    cantidad,
    destino,
    motivo,
    producto,
    existencias_anteriores,
    saldo,
    resultado,
  } = value;
  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(fecha_hora) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(fecha_hora) ||
    !Number.isFinite(Date.parse(fecha_hora)) ||
    !isNonEmptyString(solicitante) ||
    !isNonEmptyString(correo) ||
    !isNonEmptyString(codigo_producto) ||
    !isFiniteNumber(cantidad) ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0 ||
    !isNonEmptyString(destino) ||
    !isNonEmptyString(producto) ||
    !isFiniteNumber(existencias_anteriores) ||
    existencias_anteriores < 0 ||
    !isFiniteNumber(saldo) ||
    saldo < 0 ||
    (motivo !== 'despacho' && motivo !== 'traslado entre sedes' && motivo !== 'avería') ||
    (resultado !== 'APROBADO' && resultado !== 'APROBADO_CON_ALERTA')
  )
    return invalidResponse();
  return {
    id,
    fecha_hora,
    solicitante,
    correo,
    codigo_producto,
    cantidad,
    destino,
    motivo,
    producto,
    existencias_anteriores,
    saldo,
    resultado,
  };
}

function invalidResponse(): never {
  throw new ApiError(
    'invalid-response',
    'La respuesta del historial no cumple el contrato de movimientos.',
  );
}
