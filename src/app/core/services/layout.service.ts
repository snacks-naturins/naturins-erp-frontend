import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly sidebarCollapsed = signal(false);
  readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed === 'true') this.sidebarCollapsed.set(true);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.theme.set(savedTheme);
    } else {
      this.theme.set(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      );
    }

    effect(() => {
      localStorage.setItem('sidebar-collapsed', String(this.sidebarCollapsed()));
    });

    effect(() => {
      const t = this.theme();
      localStorage.setItem('theme', t);
      document.documentElement.classList.toggle('dark', t === 'dark');
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }
}
