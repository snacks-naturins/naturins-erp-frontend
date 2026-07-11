import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { NotificationService } from '../../core/services/notification.service';
import { GlobalSearchService } from '../../core/services/global-search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './header.html',
})
export class Header {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  readonly layout          = inject(LayoutService);
  readonly notifications  = inject(NotificationService);
  readonly search         = inject(GlobalSearchService);
  readonly user           = this.auth.currentUser;
  readonly notificationCount = this.notifications.totalUnread;

  readonly showDropdown = { value: false };
  readonly showPanel    = signal(false);

  initials(): string {
    return (this.user()?.username ?? '').slice(0, 2).toUpperCase() || 'NA';
  }

  onSearchInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.search.query.set(val);
    if (val.length >= 2) {
      this.search.load();
      this.showDropdown.value = true;
    } else {
      this.showDropdown.value = false;
    }
  }

  navigateTo(route: string): void {
    this.showDropdown.value = false;
    this.search.query.set('');
    this.router.navigateByUrl(route);
  }

  closeDropdown(): void {
    setTimeout(() => (this.showDropdown.value = false), 200);
  }

  togglePanel(): void {
    this.showPanel.update((v) => !v);
  }

  closePanel(): void {
    setTimeout(() => this.showPanel.set(false), 200);
  }

  navigateFromPanel(route: string): void {
    this.showPanel.set(false);
    this.router.navigateByUrl(route);
  }
}
