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
    <div class="h-full w-full bg-black p-4 rounded-xl border border-slate-700 shadow-2xl flex flex-col">
      <div class="flex items-center gap-2 mb-4 text-slate-400 text-xs font-mono uppercase tracking-widest border-b border-slate-800 pb-2">
        <i class="bi bi-terminal-fill text-indigo-500"></i>
        <span>{{ terminalTitle() }}</span>
        <span class="ml-auto flex items-center gap-2">
          <div [class]="statusColor()" class="w-1.5 h-1.5 rounded-full"></div>
          {{ statusText() }}
        </span>
      </div>
      <div #terminalContainer class="flex-1 w-full min-h-[500px]"></div>
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
      allowProposedApi: true
    });

    this.term.loadAddon(this.fitAddon);
    this.term.open(this.terminalContainer.nativeElement);
    this.fitAddon.fit();

    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    const url = this.isHostMode 
      ? this.devOpsService.getHostTerminalUrl()
      : this.devOpsService.getTerminalUrl(this.containerId);

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.statusText.set('Connected');
      this.statusColor.set('bg-emerald-500');
      this.term.writeln('\x1b[1;32mSession established. Initializing shell...\x1b[0m\r\n');
    };

    this.socket.onmessage = (event) => {
      // Handle both string and binary data
      if (typeof event.data === 'string') {
        this.term.write(event.data);
      } else {
        const reader = new FileReader();
        reader.onload = () => this.term.write(new Uint8Array(reader.result as ArrayBuffer));
        reader.readAsArrayBuffer(event.data);
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

    this.term.onData(data => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(data);
      }
    });
  }
}
