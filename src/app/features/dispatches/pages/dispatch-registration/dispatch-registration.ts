import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { finalize } from 'rxjs';
import { normalizeApiError } from '../../../../core/api/api-error';
import type { DispatchReason } from '../../models/dispatch-request';
import type { DispatchResponse, DispatchResult } from '../../models/dispatch-response';
import { DispatchService } from '../../services/dispatch.service';

function requiredText(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
}

function positiveInteger(control: AbstractControl): ValidationErrors | null {
  return Number.isSafeInteger(control.value) && control.value > 0
    ? null
    : { positiveInteger: true };
}

function validReason(control: AbstractControl): ValidationErrors | null {
  return ['despacho', 'traslado entre sedes', 'avería'].includes(control.value)
    ? null
    : { reason: true };
}

@Component({
  selector: 'app-dispatch-registration',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './dispatch-registration.html',
  styleUrl: './dispatch-registration.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchRegistration {
  private readonly service = inject(DispatchService);
  private readonly destroyRef = inject(DestroyRef);
  readonly sending = signal(false);
  readonly result = signal<DispatchResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly form = new FormGroup({
    solicitante: new FormControl('', { nonNullable: true, validators: [requiredText] }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    codigo_producto: new FormControl('', { nonNullable: true, validators: [requiredText] }),
    cantidad: new FormControl<number | null>(null, [Validators.required, positiveInteger]),
    destino: new FormControl('', { nonNullable: true, validators: [requiredText] }),
    motivo: new FormControl<DispatchReason>('despacho', {
      nonNullable: true,
      validators: [validReason],
    }),
  });
  readonly resultLabels: Record<DispatchResult, string> = {
    APROBADO: 'Despacho aprobado',
    APROBADO_CON_ALERTA: 'Despacho aprobado con alerta',
    RECHAZADO: 'Despacho rechazado',
    PRODUCTO_INEXISTENTE: 'Producto inexistente',
  };

  invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  submit(): void {
    if (this.sending()) return;
    this.result.set(null);
    this.error.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    if (values.cantidad === null) return;
    this.sending.set(true);
    this.form.disable();
    this.service
      .submit({
        ...values,
        cantidad: values.cantidad,
        solicitante: values.solicitante.trim(),
        correo: values.correo.trim(),
        codigo_producto: values.codigo_producto.trim().toUpperCase(),
        destino: values.destino.trim(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.sending.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: (response) => this.result.set(response),
        error: (error: unknown) => this.error.set(normalizeApiError(error).message),
      });
  }
}
