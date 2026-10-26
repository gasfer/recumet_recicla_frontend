import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, finalize, tap } from 'rxjs';
import Swal from 'sweetalert2';

export interface PdfPreviewDocument { blob: Blob; filename: string; title: string; id: number; }
interface PdfReservation { id: number; tab: Window | null; ready: boolean; }

@Injectable({ providedIn: 'root' })
export class PdfDocumentActionsService implements OnDestroy {
  private readonly documentSubject = new BehaviorSubject<PdfPreviewDocument | null>(null);
  readonly document$ = this.documentSubject.asObservable();
  private requestId = 0;
  private readonly reservations = new WeakMap<Blob, PdfReservation>();
  private readonly resources = new Map<number, { tab: Window; url: string; timer: number; resolvePreview: () => void; overlay?: HTMLElement }>();

  get currentDocument(): PdfPreviewDocument | null { return this.documentSubject.value; }

  prepareRequest<T extends Blob>(request: Observable<T>, enabled = true): Observable<T> {
    if (!enabled) return request;
    return new Observable<T>(subscriber => {
      const reservation: PdfReservation = { id: ++this.requestId, tab: window.open('about:blank', '_blank'), ready: false };
      if (reservation.tab) {
        reservation.tab.document.title = 'Generando PDF…';
        const doc = reservation.tab.document;
        doc.body.replaceChildren();
        doc.body.style.cssText = 'margin:0;min-height:100vh;display:grid;place-items:center;background:rgba(15,23,42,.08);font-family:Arial,sans-serif;color:var(--color-primary)';
        const card = doc.createElement('main');
        card.setAttribute('role', 'status');
        card.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;padding:28px 36px;border:1px solid #d6e9dd;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 18px 48px rgba(15,23,42,.14)';
        const spinner = doc.createElement('div');
        spinner.style.cssText = 'width:72px;height:72px;border:4px solid var(--color-success-light);border-top-color:var(--color-primary);border-right-color:var(--color-primary);border-radius:50%;animation:recumet-preview-spin .9s linear infinite;display:grid;place-items:center';
        const emblem = doc.createElement('img');
        emblem.src = new URL('assets/recumet/recumet-emblem.png', doc.baseURI).toString();
        emblem.alt = 'RECUMET';
        emblem.style.cssText = 'width:34px;height:34px;object-fit:contain';
        spinner.append(emblem);
        const brand = doc.createElement('strong');
        brand.textContent = 'RECUMET';
        brand.style.cssText = 'font-size:14px;letter-spacing:.08em';
        const message = doc.createElement('span');
        message.textContent = 'Preparando la vista previa PDF…';
        message.style.cssText = 'font-size:13px;color:#475569';
        const style = doc.createElement('style');
        style.textContent = '@keyframes recumet-preview-spin{to{transform:rotate(360deg)}}';
        doc.head.append(style);
        card.append(spinner, brand, message);
        doc.body.append(card);
      }
      return request.pipe(
        tap(blob => {
          // firstValueFrom unsubscribes before its caller can invoke show().
          reservation.ready = true;
          this.reservations.set(blob, reservation);
        }),
        finalize(() => { if (!reservation.ready) reservation.tab?.close(); })
      ).subscribe(subscriber);
    });
  }

  show(file: Blob, filename: string, title = 'Vista previa PDF'): Promise<void> {
    return new Promise(resolve => {
      let previewResolved = false;
      const finishPreview = () => {
        if (previewResolved) return;
        previewResolved = true;
        resolve();
      };
      const reservation = this.reservations.get(file) || { id: ++this.requestId, tab: window.open('about:blank', '_blank'), ready: false };
      reservation.ready = true;
      const { id, tab } = reservation;
      const reject = () => {
        tab?.close();
        if (id === this.requestId) this.showInvalidPdfMessage();
        finishPreview();
      };
      if (!(file instanceof Blob) || file.size < 8) { reject(); return; }
      void file.slice(0, 5).arrayBuffer().then(buffer => {
        if (id !== this.requestId) { tab?.close(); finishPreview(); return; }
        if (new TextDecoder().decode(buffer) !== '%PDF-') { reject(); return; }
        const safeFilename = this.sanitizeFilename(filename);
        const pdf = new Blob([file], { type: 'application/pdf' });
        this.documentSubject.next({ id, blob: pdf, filename: safeFilename, title });
        const previewWindow = tab && !tab.closed ? tab : window;
        const inline = previewWindow === window;
        const url = URL.createObjectURL(pdf);
        const doc = previewWindow.document;
        const container = inline ? doc.createElement('section') : doc.body;
        if (!inline) { doc.title = title || safeFilename; container.replaceChildren(); }
        container.style.cssText = 'margin:0;height:100vh;display:flex;flex-direction:column;font-family:Arial,sans-serif;background:#f1f5f9';
        if (inline) {
          container.style.cssText += ';position:fixed;inset:0;z-index:2147483647';
          container.setAttribute('aria-label', title);
          doc.body.append(container);
        }
        const toolbar = doc.createElement('header');
        toolbar.style.cssText = 'display:flex;gap:16px;align-items:center;padding:10px 16px;background:#0b1324;color:white';
        const label = doc.createElement('span'); label.textContent = title;
        const download = doc.createElement('a'); download.href = url; download.download = safeFilename; download.textContent = 'Descargar PDF'; download.style.cssText = 'color:white;margin-left:auto';
        const instruction = doc.createElement('span'); instruction.textContent = 'Imprima con el botón del visor PDF'; instruction.style.fontSize = '12px';
        toolbar.append(label, download, instruction);
        if (inline) {
          const close = doc.createElement('button');
          close.type = 'button'; close.textContent = 'Cerrar vista previa';
          close.style.cssText = 'background:var(--color-primary);color:white;border:0;border-radius:6px;padding:8px 12px;cursor:pointer';
          close.addEventListener('click', () => this.release(id));
          toolbar.append(close);
        }
        const viewer = doc.createElement('iframe'); viewer.src = url; viewer.title = title; viewer.style.cssText = 'flex:1;width:100%;border:0';
        viewer.addEventListener('load', finishPreview, { once: true });
        viewer.addEventListener('error', finishPreview, { once: true });
        container.append(toolbar, viewer);
        if (!inline) previewWindow.opener = null;
        const release = () => { this.release(id); finishPreview(); };
        previewWindow.addEventListener('pagehide', release, { once: true });
        const timer = window.setInterval(() => { if (previewWindow.closed) release(); }, 1000);
        this.resources.set(id, { tab: previewWindow, url, timer, resolvePreview: finishPreview, overlay: inline ? container : undefined });
      }).catch(reject);
    });
  }

  close(id?: number): void {
    if (id === undefined || this.documentSubject.value?.id === id) {
      this.requestId++;
      this.documentSubject.next(null);
    }
  }

  download(file: Blob, filename: string): void {
    if (!(file instanceof Blob) || file.size < 8) {
      this.showInvalidPdfMessage();
      return;
    }
    void file.slice(0, 5).arrayBuffer().then(buffer => {
      if (new TextDecoder().decode(buffer) !== '%PDF-') {
        this.showInvalidPdfMessage();
        return;
      }
      this.downloadBlob(new Blob([file], { type: 'application/pdf' }), this.sanitizeFilename(filename));
    });
  }

  ngOnDestroy(): void { for (const id of this.resources.keys()) this.release(id); }
  private release(id: number): void {
    const resource = this.resources.get(id);
    if (!resource) return;
    resource.overlay?.remove();
    window.clearInterval(resource.timer); URL.revokeObjectURL(resource.url); this.resources.delete(id); resource.resolvePreview();
    if (this.documentSubject.value?.id === id) this.documentSubject.next(null);
  }
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  private sanitizeFilename(filename: string): string {
    const safe = filename.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim();
    return safe.toLowerCase().endsWith('.pdf') ? safe : (safe || 'documento') + '.pdf';
  }
  private showInvalidPdfMessage(): void { void Swal.fire('PDF no válido', 'El archivo generado está vacío o no contiene un PDF válido. Intente generarlo nuevamente.', 'error'); }
}
