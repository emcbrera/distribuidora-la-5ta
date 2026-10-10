const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
// Permite probar los contratos y servicios TypeScript sin compilar archivos de salida.
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true },
  });
  module._compile(output.outputText, filename);
};
require('@angular/compiler');
const { createEnvironmentInjector, runInInjectionContext } = require('@angular/core');
const { HttpClient, HttpBackend } = require('@angular/common/http');
const { provideHttpClientTesting, HttpTestingController } = require('@angular/common/http/testing');
const { firstValueFrom } = require('rxjs');
const { API_CONFIG } = require('../src/app/core/config/api-config.ts');
const { DispatchService } = require('../src/app/features/dispatches/services/dispatch.service.ts');
const { MovementService } = require('../src/app/features/movements/services/movement.service.ts');
const { parseDispatchResponse } = require('../src/app/features/dispatches/models/dispatch-response.parser.ts');
const { parseMovementsResponse } = require('../src/app/features/movements/models/movement.parser.ts');

async function main() {
  const approved = { resultado: 'APROBADO', mensaje: 'Despacho autorizado', existencias_anteriores: 48, saldo: 38, minimo: 15 };
  for (const resultado of ['APROBADO', 'APROBADO_CON_ALERTA']) assert.equal(parseDispatchResponse({ ...approved, resultado }).resultado, resultado);
  for (const resultado of ['RECHAZADO', 'PRODUCTO_INEXISTENTE']) assert.deepEqual(parseDispatchResponse({ resultado, mensaje: 'No autorizado' }), { resultado, mensaje: 'No autorizado' });
  for (const invalid of ['Accepted', null, { ...approved, saldo: '38' }, { ...approved, saldo: -1 }, { resultado: 'DESCONOCIDO', mensaje: 'x' }]) assert.throws(() => parseDispatchResponse(invalid), e => e.kind === 'invalid-response');
  const request = { solicitante: 'Prueba', correo: 'prueba@example.com', codigo_producto: 'INS-0101', cantidad: 10, destino: 'Cali', motivo: 'despacho' };
  const movement = { ...request, id: '1', fecha_hora: '2026-10-08T21:00:00-05:00', producto: 'Harina', existencias_anteriores: 48, saldo: 38, resultado: 'APROBADO' };
  assert.deepEqual(parseMovementsResponse({ movimientos: [movement] }), [movement]);
  assert.deepEqual(parseMovementsResponse({ movimientos: [] }), []);
  for (const invalid of [{ movimientos: [{ ...movement, resultado: 'RECHAZADO' }] }, { movimientos: [{ ...movement, fecha_hora: 'ayer' }] }, []]) assert.throws(() => parseMovementsResponse(invalid), e => e.kind === 'invalid-response');

  const config = { dispatchUrl: 'https://example.com/dispatch', movementsUrl: 'https://example.com/movements', timeoutMs: 30 };
  const injector = createEnvironmentInjector([{ provide: HttpClient, useFactory: backend => new HttpClient(backend), deps: [HttpBackend] }, provideHttpClientTesting(), { provide: API_CONFIG, useValue: config }]);
  try {
    const http = injector.get(HttpTestingController);
    const dispatch = runInInjectionContext(injector, () => new DispatchService());
    const movements = runInInjectionContext(injector, () => new MovementService());
    let response = firstValueFrom(dispatch.submit(request));
    const sent = http.expectOne(config.dispatchUrl);
    assert.equal(sent.request.method, 'POST');
    assert.deepEqual(sent.request.body, request);
    sent.flush(approved);
    assert.deepEqual(await response, approved);

    response = firstValueFrom(dispatch.submit(request));
    http.expectOne(config.dispatchUrl).flush('Accepted');
    await assert.rejects(response, e => e.kind === 'invalid-response');

    response = firstValueFrom(dispatch.submit(request));
    http.expectOne(config.dispatchUrl).error(new Event('error'));
    await assert.rejects(response, e => e.kind === 'connection');
    http.expectNone(config.dispatchUrl);

    response = firstValueFrom(dispatch.submit(request));
    http.expectOne(config.dispatchUrl).flush({}, { status: 500, statusText: 'Server error' });
    await assert.rejects(response, e => e.kind === 'http');

    response = firstValueFrom(dispatch.submit(request));
    http.expectOne(config.dispatchUrl);
    await assert.rejects(response, e => e.kind === 'timeout');
    http.expectNone(config.dispatchUrl);

    response = firstValueFrom(movements.list());
    const query = http.expectOne(config.movementsUrl);
    assert.equal(query.request.method, 'GET');
    query.flush({ movimientos: [movement] });
    assert.deepEqual(await response, [movement]);
    config.movementsUrl = '';
    await assert.rejects(firstValueFrom(movements.list()), e => e.kind === 'configuration');
    http.verify();
  } finally { injector.destroy(); }
  console.log('OK: contratos, POST, GET, configuración, JSON inválido, conexión, HTTP, timeout y ausencia de reintentos. Sin llamadas reales.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
