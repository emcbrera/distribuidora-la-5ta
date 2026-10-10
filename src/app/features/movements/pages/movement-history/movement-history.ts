import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { normalizeApiError } from '../../../../core/api/api-error';
import type { Movement } from '../../models/movement';
import { MovementService } from '../../services/movement.service';

type HistoryState = 'idle' | 'loading' | 'ready' | 'error' | 'unconfigured';

@Component({
  selector: 'app-movement-history',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './movement-history.html',
  styleUrl: './movement-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementHistory implements OnInit {
  private readonly service = inject(MovementService);
  private readonly destroyRef = inject(DestroyRef);
  readonly state = signal<HistoryState>('idle');
  readonly movements = signal<readonly Movement[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    if (this.state() === 'loading') return;
    this.state.set('loading');
    this.error.set(null);
    this.movements.set([]);
    this.service
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.state() === 'loading') this.state.set('idle');
        }),
      )
      .subscribe({
        next: (movements) => {
          this.movements.set(movements);
          this.state.set('ready');
        },
        error: (error: unknown) => {
          const apiError = normalizeApiError(error);
          this.error.set(apiError.message);
          this.state.set(apiError.kind === 'configuration' ? 'unconfigured' : 'error');
        },
      });
  }
}
