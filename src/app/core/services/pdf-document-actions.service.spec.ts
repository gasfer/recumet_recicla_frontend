import { TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';
import { Subject, throwError } from 'rxjs';
import { PdfDocumentActionsService } from './pdf-document-actions.service';

describe('PdfDocumentActionsService', () => {
  let service: PdfDocumentActionsService;
  let fire: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PdfDocumentActionsService] });
    service = TestBed.inject(PdfDocumentActionsService);
    fire = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as never));
    const doc = document.implementation.createHTMLDocument('PDF');
    spyOn(window, 'open').and.returnValue({ document: doc, closed: false, close: jasmine.createSpy('close'), addEventListener: () => {}, opener: null } as unknown as Window);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:pdf-test');
    spyOn(URL, 'revokeObjectURL');
  });

  afterEach(() => service.ngOnDestroy());

  async function waitForValidation(filename?: string): Promise<void> {
    const deadline = Date.now() + 2000;
    while ((filename ? service.currentDocument?.filename !== filename : !service.currentDocument && !fire.calls.count()) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  it('opens a verified PDF with its title and download filename', async () => {
    service.show(new Blob(['%PDF-1.7\ncontent'], { type: 'application/octet-stream' }), 'compra/123', 'Boleta de compra');
    await waitForValidation('compra_123.pdf');

    expect(service.currentDocument?.title).toBe('Boleta de compra');
    expect(service.currentDocument?.filename).toBe('compra_123.pdf');
    expect(service.currentDocument?.blob.type).toBe('application/pdf');
    expect(fire).not.toHaveBeenCalled();
  });

  it('rejects an empty or non-PDF response with a visible error', async () => {
    service.show(new Blob(['not a pdf']), 'reporte.pdf');
    await waitForValidation();

    expect(service.currentDocument).toBeNull();
    expect(fire).toHaveBeenCalledWith('PDF no válido', jasmine.any(String), 'error');
  });

  it('keeps a replacement document open when the previous viewer closes', async () => {
    service.show(new Blob(['%PDF-1.7\nfirst']), 'primero.pdf');
    await waitForValidation('primero.pdf');
    const firstId = service.currentDocument!.id;

    service.show(new Blob(['%PDF-1.7\nsecond']), 'segundo.pdf');
    await waitForValidation('segundo.pdf');
    const secondId = service.currentDocument!.id;
    service.close(firstId);

    expect(service.currentDocument?.id).toBe(secondId);
    service.close(secondId);
    expect(service.currentDocument).toBeNull();
  });

  it('does not reopen a document closed before signature validation finishes', async () => {
    service.show(new Blob(['%PDF-1.7\ncontent']), 'cerrado.pdf');
    service.close();
    await Promise.resolve();

    expect(service.currentDocument).toBeNull();
  });

  it('rejects empty responses and read failures', async () => {
    service.show(new Blob([]), 'empty.pdf');
    expect(service.currentDocument).toBeNull();
    expect(fire).toHaveBeenCalled();
    fire.calls.reset();
    const blob = new Blob(['%PDF-1.7\ncontent']);
    spyOn(blob, 'slice').and.returnValue({ arrayBuffer: () => Promise.reject(new Error('read failed')) } as Blob);
    service.show(blob, 'unreadable.pdf');
    await waitForValidation();
    expect(service.currentDocument).toBeNull();
    expect(fire).toHaveBeenCalled();
  });

  it('ignores stale validation after a newer document opens', async () => {
    let resolveFirst!: (value: ArrayBuffer) => void;
    const first = new Blob(['%PDF-1.7\nfirst']);
    spyOn(first, 'slice').and.returnValue({ arrayBuffer: () => new Promise<ArrayBuffer>(resolve => resolveFirst = resolve) } as Blob);
    service.show(first, 'first.pdf');
    service.show(new Blob(['%PDF-1.7\nsecond']), 'second.pdf');
    await waitForValidation('second.pdf');
    resolveFirst(new TextEncoder().encode('invalid').buffer);
    await Promise.resolve();
    expect(service.currentDocument?.filename).toBe('second.pdf');
    expect(fire).not.toHaveBeenCalled();
  });

  it('reserves the tab before the request returns and provides a named native download', async () => {
    const request = new Subject<Blob>();
    service.prepareRequest(request).subscribe(blob => service.show(blob, 'reporte_compras.pdf', 'Compras'));
    expect(window.open).toHaveBeenCalledTimes(1);
    request.next(new Blob(['%PDF-1.7\ncontent']));
    request.complete();
    await waitForValidation('reporte_compras.pdf');
    const tab = (window.open as jasmine.Spy).calls.mostRecent().returnValue as Window;
    expect(tab.document.querySelector('iframe')?.src).toBe('blob:pdf-test');
    expect(tab.document.querySelector('a')?.download).toBe('reporte_compras.pdf');
    expect(tab.close).not.toHaveBeenCalled();
  });

  it('closes the temporary tab when the HTTP request fails', () => {
    service.prepareRequest(throwError(() => new Error('HTTP failure'))).subscribe({ error: () => {} });
    const tab = (window.open as jasmine.Spy).calls.mostRecent().returnValue as Window;
    expect(tab.close).toHaveBeenCalled();
  });

  it('does not reserve a PDF tab for Excel requests', () => {
    service.prepareRequest(new Subject<Blob>(), false).subscribe();
    expect(window.open).not.toHaveBeenCalled();
  });

  it('ignores an older HTTP response after a newer PDF request', async () => {
    const first = new Subject<Blob>();
    const second = new Subject<Blob>();
    service.prepareRequest(first).subscribe(blob => service.show(blob, 'first.pdf'));
    service.prepareRequest(second).subscribe(blob => service.show(blob, 'second.pdf'));
    second.next(new Blob(['%PDF-1.7\nsecond']));
    first.next(new Blob(['%PDF-1.7\nfirst']));
    first.complete(); second.complete();
    await waitForValidation('second.pdf');
    expect(service.currentDocument?.filename).toBe('second.pdf');
  });

  it('offers download and retry instructions when the tab is blocked', async () => {
    (window.open as jasmine.Spy).and.returnValue(null);
    spyOn(HTMLAnchorElement.prototype, 'click');
    service.show(new Blob(['%PDF-1.7\ncontent']), 'blocked.pdf');
    await waitForValidation('blocked.pdf');
    expect(fire).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Vista previa bloqueada', confirmButtonText: 'Descargar PDF' }));
  });
});

