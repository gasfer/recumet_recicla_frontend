import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PurchaseTraceabilityApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.base_url}/purchase_traceability`;

  getPurchase(idInput: number, page = 1, limit = 50, filters: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/purchase/${idInput}`, { params: new HttpParams({ fromObject: { page, limit, ...filters } as any }) });
  }
}
