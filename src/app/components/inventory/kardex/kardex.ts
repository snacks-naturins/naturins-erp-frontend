import { Component } from '@angular/core';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';

@Component({
  selector: 'app-kardex',
  imports: [Sidebar, Header],
  templateUrl: './kardex.html',
  styleUrl: './kardex.css',
})
export class Kardex {}
