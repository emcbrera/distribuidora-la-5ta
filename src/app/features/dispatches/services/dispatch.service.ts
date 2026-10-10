import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, Observable, throwError, timeout } from 'rxjs';
import { normalizeApiError, requireEndpoint } from '../../../core/api/api-error';
import { API_CONFIG } from '../../../core/config/api-config';
import type { DispatchRequest } from '../models/dispatch-request';
import type { DispatchResponse } from '../models/dispatch-response';
import { parseDispatchResponse } from '../models/dispatch-response.parser';

@Injectable({ providedIn: 'root' })
export class DispatchService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  submit(request: DispatchRequest): Observable<DispatchResponse> {
    // Sin reintentos automáticos: reenviar podría descontar el inventario dos veces.
    return defer(() =>
      this.http.post<unknown>(requireEndpoint(this.config.dispatchUrl), request),
    ).pipe(
      timeout(this.config.timeoutMs),
      map(parseDispatchResponse),
      catchError((error: unknown) => throwError(() => normalizeApiError(error))),
    );
  }
}
