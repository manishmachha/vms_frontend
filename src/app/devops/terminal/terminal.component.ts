import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit, HostListener, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { DevOpsService } from '../../services/devops.service';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full w-full bg-[#09090b]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative">
      <div class="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
      <div class="relative flex items-center gap-3 mb-4 text-slate-300 text-xs font-mono uppercase tracking-widest border-b border-white/5 pb-3">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <i class="bi bi-terminal-fill"></i>
        </div>
        <span class="font-semibold tracking-wider text-slate-200">{{ terminalTitle() }}</span>
        <span class="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5 shadow-inner">
          <div [class]="statusColor()" class="w-2 h-2 rounded-full shadow-[0_0_8px] shadow-current"></div>
          <span class="opacity-90">{{ statusText() }}</span>
        </span>
      </div>
      <div #terminalContainer class="relative flex-1 w-full min-h-[500px] rounded-lg overflow-hidden border border-white/5 bg-[#020202]"></div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    ::ng-deep .xterm { padding: 10px; height: 100%; }
    ::ng-deep .xterm-viewport { overflow-y: auto !important; }
  `]
})
export class TerminalComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('terminalContainer') terminalContainer!: ElementRef;
  
  terminalTitle = signal('Initializing...');
  statusText = signal('Connecting...');
  statusColor = signal('bg-orange-500');

  private term!: Terminal;
  private fitAddon = new FitAddon();
  private socket?: WebSocket;
  private containerId?: string;
  private isHostMode = false;

  constructor(
    private devOpsService: DevOpsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Detect mode from URL
    this.isHostMode = this.route.snapshot.url.some(segment => segment.path === 'host-terminal');
    this.containerId = this.route.snapshot.params['containerId'];
    
    this.terminalTitle.set(this.isHostMode ? 'EC2 Host Console' : `Container: ${this.containerId || 'primary'}`);
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
      cursorBlink: true,
      theme: {
        background: '#0a0a0a',
        foreground: '#d1d5db',
        cursor: '#6366f1',
        black: '#000000',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#06b6d4',
        white: '#ffffff'
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
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
    const url = this.isHostMode 
      ? this.devOpsService.getHostTerminalUrl()
      : this.devOpsService.getTerminalUrl(this.containerId);

    this.socket = new WebSocket(url);
    this.socket.binaryType = 'arraybuffer'; // highly efficient zero-chop array buffer

    this.socket.onopen = () => {
      this.statusText.set('Connected');
      this.statusColor.set('bg-emerald-500');
      this.term.writeln('\x1b[1;32mSession established. Initializing shell...\x1b[0m\r\n');
    };

    this.socket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.term.write(new Uint8Array(event.data));
      } else if (typeof event.data === 'string') {
        this.term.write(event.data);
      }
    };

    this.socket.onclose = () => {
      this.statusText.set('Disconnected');
      this.statusColor.set('bg-rose-500');
      this.term.writeln('\r\n\x1b[1;31mConnection closed.\x1b[0m');
    };

    this.socket.onerror = () => {
      this.statusText.set('Error');
      this.statusColor.set('bg-rose-500');
    };

    this.term.onData((data: string) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(data);
      }
    });
  }
}
