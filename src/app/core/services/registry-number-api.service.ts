import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type RegistryOperation = 'input' | 'output' | 'classified' | 'transfer';

export interface RegistryNumberCheck {
  operation: RegistryOperation;
  number: string;
  branchId: number;
  typeRegistry: string;
  excludeId?: number | null;
}

interface RegistryNumberCheckResponse {
  ok: boolean;
  exists: boolean;
}

@Injectable({ providedIn: 'root' })
export class RegistryNumberApiService {
  private readonly http = inject(HttpClient);

  check(request: RegistryNumberCheck): Observable<RegistryNumberCheckResponse> {
    let params = new HttpParams()
      .set('operation', request.operation)
      .set('number', request.number.trim())
      .set('branch_id', String(request.branchId))
      .set('type_registry', request.typeRegistry);

    if (request.excludeId) params = params.set('exclude_id', String(request.excludeId));

    return this.http.get<RegistryNumberCheckResponse>(`${environment.base_url}/registry-number/check`, { params });
  }
}
