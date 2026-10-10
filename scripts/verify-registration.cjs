const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true },
  }).outputText, filename);
};
require('@angular/compiler');
const { createEnvironmentInjector, runInInjectionContext } = require('@angular/core');
const { Subject } = require('rxjs');
const { DispatchService } = require('../src/app/features/dispatches/services/dispatch.service.ts');
const { DispatchRegistration } = require('../src/app/features/dispatches/pages/dispatch-registration/dispatch-registration.ts');
const { ApiError } = require('../src/app/core/api/api-error.ts');
const calls = [];
let pending;
const service = { submit(request) { calls.push(request); pending = new Subject(); return pending; } };
const injector = createEnvironmentInjector([{ provide: DispatchService, useValue: service }]);
const page = runInInjectionContext(injector, () => new DispatchRegistration());
try {
  page.submit();
  assert.equal(calls.length, 0);
  assert.equal(page.invalid('solicitante'), true);
  const valid = { solicitante: ' Persona ', correo: 'persona@example.com', codigo_producto: ' ins-9999 ', cantidad: 3, destino: ' Cali ', motivo: 'despacho' };
  for (const patch of [{ cantidad: 0 }, { cantidad: -1 }, { cantidad: 1.5 }, { cantidad: null }, { cantidad: Infinity }, { correo: 'incorrecto' }, { solicitante: '   ' }, { destino: '  ' }, { codigo_producto: ' ' }, { motivo: 'otro' }]) {
    page.form.setValue({ ...valid, ...patch });
    page.submit();
    assert.equal(calls.length, 0);
  }
  for (const resultado of ['APROBADO', 'APROBADO_CON_ALERTA', 'RECHAZADO', 'PRODUCTO_INEXISTENTE']) {
    page.form.setValue(valid);
    page.submit();
    assert.equal(page.sending(), true);
    assert.equal(page.form.disabled, true);
    const count = calls.length;
    page.submit();
    assert.equal(calls.length, count);
    assert.equal(calls.at(-1).codigo_producto, 'INS-9999');
    assert.equal(calls.at(-1).solicitante, 'Persona');
    assert.equal(calls.at(-1).destino, 'Cali');
    const response = { resultado, mensaje: 'Resultado local', existencias_anteriores: 12, saldo: 7, minimo: 10 };
    pending.next(response);
    pending.complete();
    assert.deepEqual(page.result(), response);
    assert.equal(page.sending(), false);
    assert.equal(page.form.enabled, true);
  }
  page.submit();
  assert.equal(page.result(), null);
  pending.error(new ApiError('connection', 'Error local'));
  assert.equal(page.error(), 'Error local');
  assert.equal(page.form.enabled, true);
  page.submit();
  assert.equal(page.error(), null);
  injector.destroy();
  assert.equal(page.sending(), false);
  assert.equal(pending.observed, false);
  console.log('OK: validaciones, normalización, código inexistente, bloqueo de doble envío, cuatro resultados, errores y cancelación al destruir. Sin llamadas reales.');
} finally { if (!injector.destroyed) injector.destroy(); }
