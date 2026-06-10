import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SequenceAnalysis } from '../../shared/models/sequence.model';
import { Protocol } from '../../shared/models/protocol.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SequenceService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  /** POST /api/sequence/analyse — parse FASTA and return biophysical constants */
  analyseSequence(fasta: string): Observable<SequenceAnalysis> {
    return this.http.post<SequenceAnalysis>(`${this.api}/sequence/analyse`, { fasta });
  }

  /** POST /api/protocol/generate — generate full experimental protocol */
  generateProtocol(params: {
    fasta: string;
    proteinName?: string;
    denaturantType?: string;
    stepSize?: number;
    cuvVolumeUl?: number;
    stockMultiplier?: number;
    replicates?: number;
    safetyMargin?: number;
    proteinForm?: string;
  }): Observable<Protocol> {
    return this.http.post<Protocol>(`${this.api}/protocol/generate`, params);
  }

  /** POST /api/protocol/save — save a protocol (auth required) */
  saveProtocol(protocol: Protocol): Observable<{ id: string; created_at: string }> {
    return from(this.authService.getAccessToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.post<{ id: string; created_at: string }>(
          `${this.api}/protocol/save`, protocol, { headers }
        );
      })
    );
  }

  /** GET /api/protocol/list — list saved protocols (auth required) */
  listProtocols(): Observable<Partial<Protocol>[]> {
    return from(this.authService.getAccessToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.get<Partial<Protocol>[]>(`${this.api}/protocol/list`, { headers });
      })
    );
  }

  /** GET /api/protocol/:id — get full protocol by id (auth required) */
  getProtocol(id: string): Observable<Protocol> {
    return from(this.authService.getAccessToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.get<Protocol>(`${this.api}/protocol/${id}`, { headers });
      })
    );
  }
}
