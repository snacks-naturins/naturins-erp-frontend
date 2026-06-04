import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; 
import { RouterModule, Router } from '@angular/router'; 

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule], 
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css']
})
export class ProductForm implements OnInit { // <-- Cambiado a ProductForm para corregir el enlace
  productoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      precio: [null, [Validators.required, Validators.min(0)]],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      estado: [true, [Validators.required]]
    });
  }

  ngOnInit(): void {}

  saveProduct() {
    if (this.productoForm.valid) {
      const data = this.productoForm.value;
      console.log('Enviando al backend:', data);
      alert('Producto registrado exitosamente');
      this.router.navigate(['/inventory']);
    } else {
      this.markFormGroupTouched(this.productoForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as any);
      }
    });
  }
}