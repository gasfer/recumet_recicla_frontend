# Auditoría manual responsiva

Esta matriz complementa la automatización. Se completa con Chrome real, autenticación válida y datos representativos. Cada celda debe indicar `OK` o una incidencia reproducible.

## Línea base automatizada previa

El 2026-08-20 (America/La_Paz) se aprobó `npm run e2e:acceptance` con 372/372 casos: 336 combinaciones de los 56 destinos del menú y 36 escenarios obligatorios en 320, 360, 390, 768, 1024 y 1366 px. No hubo fallos, bloqueos, pendientes, reintentos fallidos ni errores globales. La ruta auxiliar `/notifications`, que no pertenece al menú lateral, se comprobó adicionalmente en los seis tamaños con `scrollWidth === clientWidth`.

Esta línea base cubre desbordamiento global, scroll local de tablas, shell, contexto de trabajo, diálogo y tabla representativos, foco y operación automatizada con teclado. No sustituye el juicio humano sobre rotación física, orden comprensible del foco ni zoom real de Chrome al 200 %.

| Auditor | Fecha y zona horaria | Versión de Chrome | Evidencia (capturas/video) |
|---|---|---|---|
| Pendiente | Pendiente | Pendiente | Pendiente |

| Área representativa | Destino | Horizontal móvil | Solo teclado | Zoom real 200 % | Resultado | Incidencia / resolución |
|---|---|---|---|---|---|---|
| Shell y Dashboard | `/dashboard/home` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Cuentas | `/accounts/accounts-payable` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Inventarios | `/inventories/products` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Compras | `/inputs/input-small` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Ventas | `/outputs/output` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Traslados | `/transfers/transfer` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Clasificados | `/classifieds/classified` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Balanza | `/scale/truck-scale/register` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Caja | `/caja/adm-caja` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Gestión | `/managements/users` | Pendiente | Pendiente | Pendiente | Pendiente | — |
| Notificaciones | `/notifications` | Pendiente | Pendiente | Pendiente | Pendiente | — |

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
