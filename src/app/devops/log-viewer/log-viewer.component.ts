import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit, HostListener, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { DevOpsService } from '../../services/devops.service';

@Component({
  selector: 'app-log-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full w-full bg-[#09090b]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative">
      <div class="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none"></div>
      <div class="relative flex items-center gap-3 mb-4 text-slate-300 text-xs font-mono uppercase tracking-widest border-b border-white/5 pb-3">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <i class="bi bi-activity"></i>
        </div>
        <span class="font-semibold tracking-wider text-slate-200">Log Stream: {{ containerId }}</span>
        <div class="ml-auto flex items-center gap-3">
          <button (click)="clearLogs()" class="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
             <i class="bi bi-eraser"></i> Clear
          </button>
          <div class="h-4 w-px bg-white/10"></div>
          <span class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5 shadow-inner">
            <div [class]="statusColor()" class="w-2 h-2 rounded-full shadow-[0_0_8px] shadow-current transition-colors"></div>
            <span class="opacity-90">{{ statusText() }}</span>
          </span>
        </div>
      </div>
      <div #terminalContainer class="relative flex-1 w-full min-h-[600px] rounded-lg overflow-hidden border border-white/5 bg-[#020202]"></div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    ::ng-deep .xterm { padding: 12px; height: 100%; }
    ::ng-deep .xterm-viewport { overflow-y: auto !important; }
  `]
})
export class LogViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('terminalContainer') terminalContainer!: ElementRef;
  
  statusText = signal('Initializing...');
  statusColor = signal('bg-orange-500');
  containerId!: string;

  private term!: Terminal;
  private fitAddon = new FitAddon();
  private socket?: WebSocket;

  constructor(
    private devOpsService: DevOpsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.containerId = this.route.snapshot.params['containerId'];
  }

  ngAfterViewInit(): void {
    this.initTerminal();
  }

  ngOnDestroy(): void {
    this.socket?.close();
    this.term?.dispose();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.fitAddon.fit();
  }

  private initTerminal(): void {
    this.term = new Terminal({
      cursorBlink: false,
      disableStdin: true, // Output only for logs
      scrollback: 5000,
      theme: {
        background: '#020617',
        foreground: '#e2e8f0',
        cursor: '#6366f1'
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      allowProposedApi: true,
      convertEol: true
    });

    this.term.loadAddon(this.fitAddon);
    this.term.open(this.terminalContainer.nativeElement);
    
    // Delay connection until after the DOM finishes painting and terminal fits
    setTimeout(() => {
      this.fitAddon.fit();
      this.connectWebSocket();
    }, 150);
  }

  private connectWebSocket(): void {
    const url = this.devOpsService.getLogStreamUrl(this.containerId);
    this.socket = new WebSocket(url);
    this.socket.binaryType = 'arraybuffer'; // highly efficient zero-chop array buffer

    this.socket.onopen = () => {
      this.statusText.set('Live Streaming');
      this.statusColor.set('bg-emerald-500');
      this.term.writeln('\x1b[1;32mConnected. Buffering precision logs...\x1b[0m\r\n');
    };

    this.socket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.term.write(new Uint8Array(event.data));
      } else if (typeof event.data === 'string') {
        this.term.write(event.data);
      }
    };

    this.socket.onclose = () => {
      this.statusText.set('Stream Closed');
      this.statusColor.set('bg-rose-500');
      this.term.writeln('\r\n\x1b[1;31mStream closed. Reconnect for latest logs.\x1b[0m');
    };

    this.socket.onerror = () => {
      this.statusText.set('Error');
      this.statusColor.set('bg-rose-500');
    };
  }

  clearLogs(): void {
    this.term.clear();
  }
}
