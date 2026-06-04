import { Component } from '@angular/core';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';

@Component({
  selector: 'app-pos',

  standalone: true,

  imports: [
    Sidebar,
    Header
  ],

  templateUrl: './pos.html',
  styleUrl: './pos.css'
})
export class Pos {}