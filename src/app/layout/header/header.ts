import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './header.html',
})
export class Header {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.currentUser;

  initials(): string {
    return (this.user()?.username ?? '').slice(0, 2).toUpperCase() || 'NA';
  }
}
