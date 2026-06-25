import { Injector, Signal, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

/**
 * Wraps a signal with a debounce delay.
 * Must be called within an Angular injection context (component field initializer or constructor).
 */
export function debouncedSignal<T>(source: Signal<T>, ms = 300): Signal<T> {
  const injector = inject(Injector);
  return toSignal(toObservable(source, { injector }).pipe(debounceTime(ms)), {
    initialValue: source(),
    injector,
  });
}
