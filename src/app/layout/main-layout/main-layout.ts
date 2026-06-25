import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { ToastContainer } from '../../shared/components/toast-container/toast-container';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header, ToastContainer],
  templateUrl: './main-layout.html',
})
export class MainLayout {}
