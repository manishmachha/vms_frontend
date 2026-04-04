import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { DevOpsService } from '../../services/devops.service';

@Component({
  selector: 'app-log-viewer',
  standalone: false,
  template: `
    <div class="bg-slate-950 rounded-xl border border-slate-800 flex flex-col h-[500px]">
      <div class="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <span class="text-xs font-mono text-slate-400 capitalize">Container Logs: {{ containerName }}</span>
        <button (click)="clearLogs()" class="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear</button>
      </div>
      <div #logContainer class="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
        <div *ngFor="let log of logs" class="break-all whitespace-pre-wrap flex gap-3">
          <span class="text-slate-600 select-none">[{{ log.time | date:'HH:mm:ss' }}]</span>
          <span [class.text-rose-400]="log.isError" class="text-slate-300">{{ log.content }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  `]
})
export class LogViewerComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() containerId!: string;
  @Input() containerName!: string;
  @ViewChild('logContainer') private logContainer!: ElementRef;

  logs: { time: Date, content: string, isError: boolean }[] = [];
  private socket?: WebSocket;

  constructor(private devOpsService: DevOpsService) {}

  ngOnInit(): void {
    this.connect();
  }

  ngOnDestroy(): void {
    this.socket?.close();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private connect(): void {
    const url = this.devOpsService.getLogStreamUrl(this.containerId);
    this.socket = new WebSocket(url);

    this.socket.onmessage = (event) => {
      this.logs.push({
        time: new Date(),
        content: event.data,
        isError: event.data.toLowerCase().includes('error') || event.data.toLowerCase().includes('exception')
      });
      if (this.logs.length > 1000) this.logs.shift();
    };
  }

  clearLogs(): void {
    this.logs = [];
  }

  private scrollToBottom(): void {
    try {
      this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
