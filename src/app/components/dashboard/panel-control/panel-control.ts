import { Component } from '@angular/core';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';

@Component({
  selector: 'app-panel-control',
  imports: [Sidebar, Header],
  templateUrl: './panel-control.html',
  styleUrl: './panel-control.css',
})
export class PanelControl {}
