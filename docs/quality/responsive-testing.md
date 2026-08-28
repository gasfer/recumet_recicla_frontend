# Pruebas responsivas

## Preparación

El backend debe estar disponible en el puerto 3000 y el frontend en el puerto 4200. El usuario de prueba debe tener acceso a todos los destinos del manifiesto, Sucursal y Almacén válidos y datos representativos para Productos, Cuentas, Compras, Ventas, Traslados, Clasificados, Balanza y Caja. Productos debe devolver más de diez filas y permitir la acción `Precios`; así la aceptación demuestra un cambio real de orden, un cambio real de página y la apertura/cierre del diálogo, en lugar de limitarse a comprobar que existen los controles.

Desde la raíz de `RECICLA_2026`, iniciar cada servicio en una terminal independiente:

```powershell
Set-Location .\recumet_recicla_backend
npm start
```

```powershell
Set-Location .\recumet_recicla_frontend
npm start -- --host 127.0.0.1 --port 4200
```

Instalación local única del componente requerido por las trazas de Playwright:

```powershell
npx playwright install ffmpeg
```

Las pruebas autenticadas no guardan credenciales en el repositorio. Antes de la aceptación se definen:

```powershell
$env:E2E_EMAIL = "usuario-de-prueba@dominio.com"
$env:E2E_PASSWORD = "contraseña-del-usuario-de-prueba"
$env:E2E_BASE_URL = "http://127.0.0.1:4200"
npm run e2e:acceptance
```

`e2e:acceptance` falla de forma explícita si falta una variable, el frontend no responde, una prueba se omite o la matriz no queda totalmente aprobada. `npm run e2e` puede seguir usándose durante desarrollo y omite los escenarios autenticados cuando faltan credenciales; una corrida con pruebas omitidas no es evidencia de aceptación.

## Cobertura

- Viewports: 320, 360, 390, 768, 1024 y 1366 px.
- Sidebar, topbar, contexto de trabajo, teclado y cambio de orientación.
- Los 56 destinos registrados del manifiesto de navegación.
- Diálogo, tabla y formulario representativos.
- Ausencia de overflow horizontal global; `app-table-scroll` es la única región autorizada para scroll horizontal local.

El inventario registra 38 definiciones de tabla: 36 de scroll, una apilada y la definición compartida controlada por input. Sus 46 consumidores declaran la decisión de forma explícita: 30 usan `scroll` por complejidad y 16 usan `stack` por ser tablas simples de hasta cinco columnas.

El proyecto de 320 px también sirve como aproximación automatizada al reflow que produce un zoom elevado. No sustituye la comprobación manual del navegador con zoom real al 200 %.

## Validación completa

Ejecutar desde `recumet_recicla_frontend`:

```powershell
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npm run verify:inline-styles:strict
npm run verify:responsive-inventory
npm run e2e:acceptance
```

La aceptación requiere que todas las órdenes finalicen correctamente y que Playwright informe cero fallos y cero pruebas omitidas. Solo una ejecución completa y aprobada de `e2e:acceptance` actualiza automáticamente:

- `docs/quality/responsive-audit-matrix.json`, con resultado e incidencia por ruta y viewport.
- `docs/quality/responsive-audit-matrix.md`, como vista resumida versionable.

Las ejecuciones exploratorias o filtradas escriben `test-results/responsive-audit-partial.*` y nunca reemplazan la evidencia oficial.

La revisión manual se registra en `docs/quality/responsive-manual-audit.md`. Debe completarse en Chrome real para orientación horizontal, navegación exclusiva con teclado y zoom real al 200 %, repitiendo cualquier caso afectado después de corregirlo.

## Alcance del backend

Este cambio no requiere editar el backend ni sus contratos. Antes y después de la aceptación se debe comparar el estado de `recumet_recicla_backend`; cualquier diferencia debe atribuirse y aislarse en su propio cambio antes de cerrar esta auditoría.

Registrar el mismo commit y estado antes y después, desde `recumet_recicla_backend`:

```powershell
git rev-parse HEAD
git status --short
```

Si el repositorio ya contiene cambios ajenos, conservar ambos registros y no atribuirlos a esta implementación sin un baseline aislado.

La observación de alcance de esta sesión está registrada en `docs/quality/backend-scope-check.md`.
