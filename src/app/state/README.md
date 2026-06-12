# state/

Estado **global** de la aplicación compartido entre features.

- `stores/` — stores basados en Signals de Angular (o NgRx/otro si se adopta).

Ejemplos: sesión del usuario, carrito del POS, catálogo en caché.
El estado local de un solo componente se queda dentro de ese componente.
