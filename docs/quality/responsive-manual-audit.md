# Auditoría manual responsiva

Esta matriz complementa la automatización. Se completa con Chrome real, autenticación válida y datos representativos. Cada celda debe indicar `OK` o una incidencia reproducible.

## Línea base automatizada previa

El 2026-08-20 (America/La_Paz) se aprobó `npm run e2e:acceptance` con 372/372 casos: 336 combinaciones de los 56 destinos del menú y 36 escenarios obligatorios en 320, 360, 390, 768, 1024 y 1366 px. No hubo fallos, bloqueos, pendientes, reintentos fallidos ni errores globales. La ruta auxiliar `/notifications`, que no pertenece al menú lateral, se comprobó adicionalmente en los seis tamaños con `scrollWidth === clientWidth`.

Esta línea base cubre desbordamiento global, scroll local de tablas, shell, contexto de trabajo, diálogo y tabla representativos, foco y operación automatizada con teclado. No sustituye el juicio humano sobre rotación física, orden comprensible del foco ni zoom real de Chrome al 200 %.

| Auditor | Fecha y zona horaria | Versión de Chrome | Evidencia (capturas/video) |
|---|---|---|---|
| Codex (navegador integrado) | 2026-09-02, America/La_Paz | Chromium integrado; Chrome real no disponible | EV-2026-09-02-HK: recorrido interactivo de 11 rutas |

| Área representativa | Destino | Horizontal móvil | Solo teclado | Zoom real 200 % | Resultado | Incidencia / resolución |
|---|---|---|---|---|---|---|
| Shell y Dashboard | `/dashboard/home` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |
| Cuentas | `/accounts/accounts-payable` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |
| Inventarios | `/inventories/products` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Tabla contenida localmente; zoom real requiere Chrome |
| Compras | `/inputs/input-small` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |
| Ventas | `/outputs/output` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |
| Traslados | `/transfers/transfer` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |
| Clasificados | `/classifieds/classified` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |
| Balanza | `/scale/truck-scale/register` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |
| Caja | `/caja/adm-caja` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |
| Gestión | `/managements/users` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |
| Notificaciones | `/notifications` | OK (EV-2026-09-02-HK) | OK (EV-2026-09-02-HK) | Pendiente | Parcial | Zoom real requiere Chrome |

La repetición del 2026-09-02 no detectó desbordamiento horizontal global ni contenido esencial inaccesible en las 11 rutas. El menú móvil abrió mediante `Espacio`, cerró con `Escape` y devolvió el foco al control de apertura. No se registraron incidencias nuevas que requieran corrección. El navegador integrado no aplicó zoom mediante `Ctrl+0`/`Ctrl++`; por ello la columna de zoom permanece pendiente y no se sustituye con la aproximación de viewport estrecho.

## Criterios

- Horizontal móvil: usar una altura visible reducida y comprobar encabezado, contenido, diálogos y acciones.
- Solo teclado: recorrer con `Tab` y `Shift+Tab`; activar con `Enter` y `Espacio`; cerrar cuando corresponda con `Escape`; verificar foco visible y retorno del foco.
- Zoom real 200 %: aplicar el zoom del navegador, no solo reducir el viewport; comprobar reflow, ausencia de superposición y acceso a todo contenido esencial.
- Toda incidencia debe incluir ruta, dimensiones, pasos, resultado observado y confirmación de la repetición después de corregirla.

## Procedimiento de cierre

1. Completar primero la columna **Horizontal móvil** en las 11 rutas, rotando un dispositivo real sin recargar. En Dashboard comprobar también el sidebar; en Productos abrir el diálogo; en Cuentas comprobar el scroll local de la tabla.
2. Recorrer las mismas rutas sin ratón. Usar `Tab` y `Shift+Tab`, activar al menos una acción no destructiva con `Enter` y, cuando aplique, `Espacio`; cerrar capas con `Escape` y comprobar el retorno del foco.
3. En Chrome de escritorio, restablecer con `Ctrl+0`, seleccionar zoom real 200 % y repetir las 11 rutas. Comprobar reflow, texto y controles sin superposición, dropdowns dentro del viewport y acciones esenciales accesibles.
4. Registrar auditor, fecha/zona, versión de Chrome y evidencia. Usar `OK (EV-xx)` por celda o `INC-xx`; si existe una incidencia, corregirla y registrar su repetición antes de marcar el resultado como `OK`.
