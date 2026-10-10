import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, Observable, throwError, timeout } from 'rxjs';
import { normalizeApiError, requireEndpoint } from '../../../core/api/api-error';
import { API_CONFIG } from '../../../core/config/api-config';
import type { Movement } from '../models/movement';
import { parseMovementsResponse } from '../models/movement.parser';

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  list(): Observable<readonly Movement[]> {
    return defer(() => this.http.get<unknown>(requireEndpoint(this.config.movementsUrl))).pipe(
      timeout(this.config.timeoutMs),
      map(parseMovementsResponse),
      catchError((error: unknown) => throwError(() => normalizeApiError(error))),
    );
  }
}
