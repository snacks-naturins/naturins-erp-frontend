import { Pipe, PipeTransform } from '@angular/core';

type FormatoFecha = 'corto' | 'largo' | 'mini' | 'relativo';

@Pipe({ name: 'fecha', standalone: true })
export class FechaPipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    formato: FormatoFecha = 'corto',
    nullText = '—',
  ): string {
    if (!value) return nullText;
    const fecha = new Date(value);
    if (isNaN(fecha.getTime())) return nullText;

    if (formato === 'relativo') return this.relativo(fecha);

    const opciones: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      year: formato === 'mini' ? undefined : 'numeric',
      month: formato === 'largo' ? 'long' : 'short',
      ...(formato === 'largo' ? { hour: '2-digit', minute: '2-digit' } : {}),
    };
    return fecha.toLocaleDateString('es-PE', opciones);
  }

  private relativo(fecha: Date): string {
    const diff = Date.now() - fecha.getTime();
    const minutos = Math.floor(diff / 60_000);
    if (minutos < 1)  return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24)   return `Hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7)     return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (dias < 30)    return `Hace ${Math.floor(dias / 7)} sem.`;
    if (dias < 365)   return `Hace ${Math.floor(dias / 30)} mes${Math.floor(dias / 30) > 1 ? 'es' : ''}`;
    return `Hace ${Math.floor(dias / 365)} año${Math.floor(dias / 365) > 1 ? 's' : ''}`;
  }
}
