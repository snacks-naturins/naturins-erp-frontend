# features/

Cada módulo de negocio del ERP es una **feature** autocontenida:

```
<feature>/
├── pages/                 # vistas/componentes de la feature
├── services/              # servicios propios de la feature
├── models/                # modelos/interfaces propios de la feature
└── <feature>.routes.ts    # rutas de la feature (lazy loading)
```

Features actuales:
- `usuarios/`   — login y gestión de usuarios.
- `inventario/` — productos, registro y kardex.
- `ventas/`     — punto de venta (POS).
- `compras/`    — (pendiente) órdenes de compra, proveedores.
- `clientes/`   — (pendiente) gestión de clientes.

Las rutas de cada feature se agregan en `src/app/routes/app.routes.ts`.
