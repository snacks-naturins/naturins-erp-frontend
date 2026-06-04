import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 
import { ProductoService, Producto } from '../../../services/productoService';

@Component({
  selector: 'app-products-list',
  standalone: true, 
  imports: [CommonModule, RouterModule], 
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.css']
})
export class ProductList implements OnInit { // <-- Cambiado a ProductList
  productos: Producto[] = [];
  loading: boolean = true;

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.loading = true;
    this.productoService.listarTodos().subscribe({
      next: (data) => {
        this.productos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos', err);
        this.loading = false;
      }
    });
  }
}