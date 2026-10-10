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
const { MovementHistory } = require('../src/app/features/movements/pages/movement-history/movement-history.ts');
const { MovementService } = require('../src/app/features/movements/services/movement.service.ts');
let count = 0;
let pending;
const injector = createEnvironmentInjector([{ provide: MovementService, useValue: { list() { count++; pending = new Subject(); return pending; } } }]);
const page = runInInjectionContext(injector, () => new MovementHistory());
try {
  page.ngOnInit();
  assert.equal(page.state(), 'loading');
  page.refresh();
  assert.equal(count, 1);
  pending.next([]); pending.complete();
  assert.equal(page.state(), 'ready');
  assert.deepEqual(page.movements(), []);
  page.refresh();
  const rows = [{ id: '1', resultado: 'APROBADO' }, { id: '2', resultado: 'APROBADO_CON_ALERTA' }];
  pending.next(rows); pending.complete();
  assert.deepEqual(page.movements(), rows);
  assert.equal(page.state(), 'ready');
  page.refresh();
  assert.deepEqual(page.movements(), []);
  pending.error(new ApiError('connection', 'Error de conexión local'));
  assert.equal(page.state(), 'error');
  assert.equal(page.error(), 'Error de conexión local');
  page.refresh();
  assert.equal(page.error(), null);
  pending.error(new ApiError('configuration', 'Falta dirección'));
  assert.equal(page.state(), 'unconfigured');
  page.refresh();
  injector.destroy();
  assert.equal(pending.observed, false);
  assert.equal(page.state(), 'idle');
  console.log('OK: carga inicial, actualización, bloqueo de consultas simultáneas, datos, vacío, error, configuración y destrucción. Sin llamadas reales.');
} finally { if (!injector.destroyed) injector.destroy(); }