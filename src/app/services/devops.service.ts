import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DevOpsService {
  private apiUrl = '/api/admin/devops';

  constructor(private http: HttpClient) {}

  getBranches(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/branches`);
  }

  getCommits(branchName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/branches/${branchName}/commits`);
  }

  getContainers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/containers`);
  }

  containerAction(containerId: string, action: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/containers/${containerId}/action?action=${action}`, {});
  }

  deploy(branchName: string, imageTag: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/deploy`, { branchName, imageTag });
  }

  undeploy(branchName: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deploy/${branchName}`);
  }

  getLogStreamUrl(containerId: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/ws/logs?containerId=${containerId}`;
  }

  getTerminalUrl(containerId?: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = containerId ? `?containerId=${containerId}` : '';
    return `${protocol}//${window.location.host}/api/ws/terminal${params}`;
  }
}
