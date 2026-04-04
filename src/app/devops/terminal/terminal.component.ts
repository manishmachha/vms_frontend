import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { DevOpsService } from '../../services/devops.service';

@Component({
  selector: 'app-terminal',
  standalone: false,
  template: `
    <div class="h-full w-full bg-black p-4 rounded-xl border border-slate-700 shadow-2xl">
      <div class="flex items-center gap-2 mb-4 text-slate-400 text-xs font-mono uppercase tracking-widest border-b border-slate-800 pb-2">
        <i class="bi bi-terminal-fill text-indigo-500"></i>
        <span>VMS-Remote-Console</span>
        <span class="ml-auto flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          Connected
        </span>
      </div>
      <div #terminalContainer class="h-[600px] w-full"></div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    ::ng-deep .xterm { padding: 10px; }
  `]
})
export class TerminalComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('terminalContainer') terminalContainer!: ElementRef;
  private term!: Terminal;
  private fitAddon = new FitAddon();
  private socket?: WebSocket;

  constructor(private devOpsService: DevOpsService) {}

  ngOnInit(): void {}

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
        cursor: '#6366f1'
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14
    });

    this.term.loadAddon(this.fitAddon);
    this.term.open(this.terminalContainer.nativeElement);
    this.fitAddon.fit();

    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    const url = this.devOpsService.getTerminalUrl();
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.term.writeln('\x1b[1;32mConnection established. Initializing shell...\x1b[0m\r\n');
    };

    this.socket.onmessage = (event) => {
      this.term.write(event.data);
    };

    this.socket.onclose = () => {
      this.term.writeln('\r\n\x1b[1;31mConnection closed.\x1b[0m');
    };

    this.term.onData(data => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(data);
      }
    });
  }
}
