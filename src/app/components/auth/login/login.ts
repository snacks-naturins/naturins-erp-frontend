import { Component } from '@angular/core';
import { Router } from '@angular/router'; // 1. Importamos el enrutador
import { FormsModule } from '@angular/forms'; // Necesario si manejas formularios estándar

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule], // Asegura compatibilidad con formularios nativos
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  
  // 2. Inyectamos el servicio Router en el constructor
  constructor(private router: Router) {}

  // 3. Método que se ejecutará al enviar el formulario
  onLogin(event: Event): void {
    event.preventDefault(); // Evita que la página se recargue de forma convencional
    
    // Aquí más adelante conectarás tu API para validar el usuario y contraseña
    console.log('Iniciando sesión en Naturins ERP...');

    // Redirige automáticamente al componente del Panel de Control
    this.router.navigate(['/dashboard']);
  }
}

