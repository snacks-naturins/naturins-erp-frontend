import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [], // Al ser flotante sobre otra vista, no necesitas Sidebar ni Header aquí dentro
  templateUrl: './order-form.html',
  styleUrl: './order-form.css',
})
export class OrderForm {
  // Evento para notificar al componente padre que se debe cerrar el modal
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  saveOrder() {
    // Aquí irá la lógica de backend
    console.log('Orden guardada');
    this.closeModal();
  }

mostrarFormularioFlotante = false;

abrirModal() { this.mostrarFormularioFlotante = true; }
cerrarModal() { this.mostrarFormularioFlotante = false; }
}
