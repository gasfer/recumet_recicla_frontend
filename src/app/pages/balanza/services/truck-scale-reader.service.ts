import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TruckScaleReading {
  ok: boolean;
  peso: number;
  unit: 'kg';
}

export interface TruckWeighingRecord {
  id: number;
  ticket: string;
  registered_at: string;
  first_weight: number | string;
  second_weight: number | string | null;
  tare: number | string | null;
  gross: number | string | null;
  net: number | string | null;
  ing_sal: string | null;
  first_time: string;
  second_time: string | null;
  state: 'PRIMER_PESO' | 'COMPLETO' | 'ANULADO';
  details: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class TruckScaleReaderService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.truckScaleReaderUrl;

  readWeight(): Observable<TruckScaleReading> {
    return this.http.get<TruckScaleReading>(this.url);
  }

  listWeighings(): Observable<{ ok: boolean; weighings: TruckWeighingRecord[] }> {
    return this.http.get<{ ok: boolean; weighings: TruckWeighingRecord[] }>(`${environment.base_url}/scale/truck-weighings`);
  }

  createFirstWeight(payload: {
    ticket: string;
    registered_at: string;
    first_weight: number;
    first_time: string;
    details: Record<string, any>;
  }): Observable<{ ok: boolean; weighing: TruckWeighingRecord }> {
    return this.http.post<{ ok: boolean; weighing: TruckWeighingRecord }>(`${environment.base_url}/scale/truck-weighings`, payload);
  }

  updateFirstWeight(id: number, payload: {
    ticket: string;
    registered_at: string;
    first_weight: number;
    first_time: string;
    details: Record<string, any>;
  }): Observable<{ ok: boolean; weighing: TruckWeighingRecord }> {
    return this.http.put<{ ok: boolean; weighing: TruckWeighingRecord }>(`${environment.base_url}/scale/truck-weighings/${id}`, payload);
  }

  completeSecondWeight(id: number, payload: { second_weight: number; second_time: string }): Observable<{ ok: boolean; weighing: TruckWeighingRecord }> {
    return this.http.put<{ ok: boolean; weighing: TruckWeighingRecord }>(`${environment.base_url}/scale/truck-weighings/${id}/second-weight`, payload);
  }

  deleteWeighing(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${environment.base_url}/scale/truck-weighings/${id}`);
  }
}
