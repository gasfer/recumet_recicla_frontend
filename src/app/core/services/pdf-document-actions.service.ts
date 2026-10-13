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
  private readonly resources = new Map<number, { tab: Window; url: string; timer: number }>();

  get currentDocument(): PdfPreviewDocument | null { return this.documentSubject.value; }

  prepareRequest<T extends Blob>(request: Observable<T>, enabled = true): Observable<T> {
    if (!enabled) return request;
    return new Observable<T>(subscriber => {
      const reservation: PdfReservation = { id: ++this.requestId, tab: window.open('about:blank', '_blank'), ready: false };
      if (reservation.tab) {
        reservation.tab.document.title = 'Generando PDF…';
        reservation.tab.document.body.textContent = 'Generando documento PDF…';
      }
      return request.pipe(
        tap(blob => this.reservations.set(blob, reservation)),
        finalize(() => { if (!reservation.ready) reservation.tab?.close(); })
      ).subscribe(subscriber);
    });
  }

  show(file: Blob, filename: string, title = 'Vista previa PDF'): void {
    const reservation = this.reservations.get(file) || { id: ++this.requestId, tab: window.open('about:blank', '_blank'), ready: false };
    reservation.ready = true;
    const { id, tab } = reservation;
    const reject = () => { tab?.close(); if (id === this.requestId) this.showInvalidPdfMessage(); };
    if (!(file instanceof Blob) || file.size < 8) { reject(); return; }
    void file.slice(0, 5).arrayBuffer().then(buffer => {
      if (id !== this.requestId) { tab?.close(); return; }
      if (new TextDecoder().decode(buffer) !== '%PDF-') { reject(); return; }
      const safeFilename = this.sanitizeFilename(filename);
      const pdf = new Blob([file], { type: 'application/pdf' });
      this.documentSubject.next({ id, blob: pdf, filename: safeFilename, title });
      if (!tab || tab.closed) {
        void Swal.fire({ title: 'Vista previa bloqueada', text: 'Permita abrir pestañas y vuelva a intentar, o descargue el PDF.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Descargar PDF', cancelButtonText: 'Cerrar' }).then(result => {
          if (result.isConfirmed) this.downloadBlob(pdf, safeFilename);
        });
        return;
      }
      const url = URL.createObjectURL(pdf);
      const doc = tab.document;
      doc.title = title || safeFilename;
      doc.body.replaceChildren();
      doc.body.style.cssText = 'margin:0;height:100vh;display:flex;flex-direction:column;font-family:Arial,sans-serif;background:#f1f5f9';
      const toolbar = doc.createElement('header');
      toolbar.style.cssText = 'display:flex;gap:16px;align-items:center;padding:10px 16px;background:#0b1324;color:white';
      const label = doc.createElement('span'); label.textContent = title;
      const download = doc.createElement('a'); download.href = url; download.download = safeFilename; download.textContent = 'Descargar PDF'; download.style.cssText = 'color:white;margin-left:auto';
      const instruction = doc.createElement('span'); instruction.textContent = 'Imprima con el botón del visor PDF'; instruction.style.fontSize = '12px';
      toolbar.append(label, download, instruction);
      const viewer = doc.createElement('iframe'); viewer.src = url; viewer.title = title; viewer.style.cssText = 'flex:1;width:100%;border:0';
      doc.body.append(toolbar, viewer);
      tab.opener = null;
      const release = () => this.release(id);
      tab.addEventListener('pagehide', release, { once: true });
      const timer = window.setInterval(() => { if (tab.closed) release(); }, 1000);
      this.resources.set(id, { tab, url, timer });
    }).catch(reject);
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
    window.clearInterval(resource.timer); URL.revokeObjectURL(resource.url); this.resources.delete(id);
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
