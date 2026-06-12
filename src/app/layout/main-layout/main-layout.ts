import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';

/**
 * Cáscara principal de la app autenticada: sidebar fijo + topbar + contenido.
 * Las páginas protegidas se renderizan en el <router-outlet>.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './main-layout.html',
})
export class MainLayout {}
