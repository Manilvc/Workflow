import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <header class="app-header">
        <div class="header-left">
          <span class="logo-icon material-icons-outlined">verified</span>
          <span class="logo-text">EveryCred</span>
          <span class="logo-divider"></span>
          <span class="logo-subtitle">Workflow Manager</span>
        </div>
        <nav class="header-nav">
          <a routerLink="/builder" routerLinkActive="active" class="nav-link">
            <span class="material-icons-outlined">build</span>
            Builder
          </a>
          <a routerLink="/requests" routerLinkActive="active" class="nav-link">
            <span class="material-icons-outlined">list_alt</span>
            Requests
          </a>
        </nav>
        <div class="header-right">
          <button class="btn-icon notification-btn" (click)="toggleNotifications()">
            <span class="material-icons-outlined">notifications</span>
            @if (notificationService.notifications().length > 0) {
              <span class="notification-dot"></span>
            }
          </button>
          <div class="avatar">A</div>
        </div>
      </header>
      <main class="app-main">
        <router-outlet />
      </main>
    </div>

    <!-- Toast notifications -->
    <div class="toast-container">
      @for (n of notificationService.notifications(); track n.id) {
        <div class="toast toast-{{ n.type }}">
          <span class="material-icons-outlined">
            {{ n.type === 'success' ? 'check_circle' : n.type === 'error' ? 'error' : n.type === 'warning' ? 'warning' : 'info' }}
          </span>
          <div>
            <div style="font-weight: 600; font-size: 13px;">{{ n.title }}</div>
            <div style="font-size: 12px; color: var(--color-text-secondary);">{{ n.message }}</div>
          </div>
          <button class="btn-icon" (click)="notificationService.dismiss(n.id)">
            <span class="material-icons-outlined" style="font-size:16px;">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      padding: 0 24px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      color: var(--color-primary);
      font-size: 24px;
    }

    .logo-text {
      font-weight: 700;
      font-size: 16px;
      color: var(--color-text);
    }

    .logo-divider {
      width: 1px;
      height: 20px;
      background: var(--color-border);
      margin: 0 4px;
    }

    .logo-subtitle {
      font-size: 13px;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      font-weight: 500;
      font-size: 13px;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--color-hover);
        color: var(--color-text);
      }

      &.active {
        background: var(--color-primary-bg);
        color: var(--color-primary);
      }

      .material-icons-outlined {
        font-size: 18px;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .notification-btn {
      position: relative;
      padding: 8px;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);

      &:hover { background: var(--color-hover); }
    }

    .notification-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-danger);
      border: 2px solid var(--color-surface);
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 13px;
    }

    .app-main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `,
})
export class App {
  protected readonly notificationService = inject(NotificationService);

  protected toggleNotifications(): void {
    // placeholder for notification panel toggle
  }
}
