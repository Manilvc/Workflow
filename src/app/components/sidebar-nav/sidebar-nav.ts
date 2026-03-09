import { Component, input, output } from '@angular/core';
import { NavigationSection, NAV_SECTIONS } from '../../models/workflow.model';

@Component({
  selector: 'app-sidebar-nav',
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="material-icons-outlined">settings_suggest</span>
        <span>Configuration</span>
      </div>
      <nav class="sidebar-nav">
        @for (section of sections; track section.id) {
          <button
            class="nav-item"
            [class.active]="activeSection() === section.id"
            (click)="sectionChange.emit(section.id)">
            <span class="material-icons-outlined">{{ section.icon }}</span>
            <span>{{ section.label }}</span>
          </button>
        }
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-help">
          <span class="material-icons-outlined">help_outline</span>
          <span>Need help?</span>
        </div>
      </div>
    </aside>
  `,
  styles: `
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 16px 12px;
      font-weight: 600;
      font-size: 13px;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;

      .material-icons-outlined { font-size: 18px; }
    }

    .sidebar-nav {
      flex: 1;
      padding: 0 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      font-weight: 500;
      font-size: 13px;
      text-align: left;
      transition: all var(--transition-fast);
      width: 100%;

      &:hover {
        background: var(--color-hover);
        color: var(--color-text);
      }

      &.active {
        background: var(--color-primary-bg);
        color: var(--color-primary);
      }

      .material-icons-outlined { font-size: 18px; }
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--color-border);
    }

    .sidebar-help {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--color-text-muted);
      cursor: pointer;

      &:hover { color: var(--color-primary); }

      .material-icons-outlined { font-size: 16px; }
    }
  `,
})
export class SidebarNav {
  readonly activeSection = input.required<string>();
  readonly sectionChange = output<string>();
  protected readonly sections: NavigationSection[] = NAV_SECTIONS;
}
