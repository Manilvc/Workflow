import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CredentialRequest, WORKFLOW_ROLES } from '../../models/workflow.model';

@Component({
  selector: 'app-request-sidebar',
  imports: [DatePipe],
  template: `
    <aside class="sidebar">
      <!-- Participants -->
      <section class="sidebar-section">
        <h3 class="section-title">
          <span class="material-icons-outlined" style="font-size:16px;">group</span>
          Participants
        </h3>
        @if (request().participants.length > 0) {
          @for (p of request().participants; track p.email) {
            <div class="participant-card">
              <div class="participant-avatar" [class]="'role-' + p.role">
                {{ p.name.charAt(0).toUpperCase() }}
              </div>
              <div class="participant-info">
                <div class="participant-name">{{ p.name }}</div>
                <div class="participant-email">{{ p.email }}</div>
              </div>
              <span class="participant-status" [class]="'status-' + p.status">
                {{ formatStatus(p.status) }}
              </span>
            </div>
          }
        } @else {
          <div class="empty-text">No participants yet</div>
        }
      </section>

      <!-- Workflow Overview -->
      <section class="sidebar-section">
        <h3 class="section-title">
          <span class="material-icons-outlined" style="font-size:16px;">account_tree</span>
          Workflow
        </h3>
        <div class="workflow-mini">
          @for (stage of request().workflow.stages; track stage.id; let i = $index) {
            <div class="mini-stage"
              [class.completed]="i < request().currentStageIndex"
              [class.active]="i === request().currentStageIndex"
              [class.pending]="i > request().currentStageIndex">
              <div class="mini-dot" [class.data]="stage.type === 'data_collection'" [class.approval]="stage.type === 'approval'">
                @if (i < request().currentStageIndex) {
                  <span class="material-icons-outlined" style="font-size:10px; color:white;">check</span>
                }
              </div>
              <span class="mini-label">{{ stage.name }}</span>
            </div>
          }
        </div>
      </section>

      <!-- Activity Timeline -->
      <section class="sidebar-section">
        <h3 class="section-title">
          <span class="material-icons-outlined" style="font-size:16px;">history</span>
          Activity
        </h3>
        <div class="activity-list">
          @for (entry of request().activity; track entry.timestamp) {
            <div class="activity-item">
              <div class="activity-dot" [class]="'dot-' + entry.type"></div>
              <div class="activity-content">
                <div class="activity-message">{{ entry.message }}</div>
                <div class="activity-time">{{ entry.timestamp | date:'MMM d, h:mm a' }}</div>
              </div>
            </div>
          }
        </div>
      </section>
    </aside>
  `,
  styles: `
    .sidebar {
      width: 320px;
      min-width: 320px;
      background: var(--color-surface);
      border-left: 1px solid var(--color-border);
      overflow-y: auto;
      height: 100%;
    }

    .sidebar-section {
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 12px;
    }

    .participant-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
    }

    .participant-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 11px;
      color: white;

      &.role-holder { background: var(--color-primary); }
      &.role-issuer { background: var(--color-purple); }
      &.role-data_collector { background: var(--color-success); }
    }

    .participant-info {
      flex: 1;
      min-width: 0;
    }

    .participant-name {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .participant-email {
      font-size: 11px;
      color: var(--color-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .participant-status {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;

      &.status-submitted { background: var(--color-success-bg); color: var(--color-success); }
      &.status-pending { background: var(--color-warning-bg); color: var(--color-warning); }
      &.status-invited { background: var(--color-primary-bg); color: var(--color-primary); }
    }

    .empty-text {
      font-size: 12px;
      color: var(--color-text-muted);
      padding: 8px 0;
    }

    .workflow-mini {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .mini-stage {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: var(--radius-sm);
      transition: background var(--transition-fast);

      &.active { background: var(--color-primary-bg); }
      &.completed { opacity: 0.7; }
    }

    .mini-dot {
      width: 16px;
      height: 16px;
      min-width: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      &.data { background: var(--color-success); }
      &.approval { background: var(--color-primary); }
    }

    .pending .mini-dot {
      opacity: 0.4;
    }

    .mini-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .active .mini-label {
      color: var(--color-primary);
      font-weight: 600;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
    }

    .activity-item {
      display: flex;
      gap: 10px;
      padding: 6px 0;
      position: relative;

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 20px;
        bottom: -4px;
        width: 1px;
        background: var(--color-border);
      }
    }

    .activity-dot {
      width: 10px;
      height: 10px;
      min-width: 10px;
      border-radius: 50%;
      margin-top: 4px;

      &.dot-info { background: var(--color-primary); }
      &.dot-success { background: var(--color-success); }
      &.dot-warning { background: var(--color-warning); }
      &.dot-error { background: var(--color-danger); }
    }

    .activity-message {
      font-size: 12px;
      color: var(--color-text);
    }

    .activity-time {
      font-size: 10px;
      color: var(--color-text-muted);
    }

    @media (max-width: 1024px) {
      .sidebar {
        width: 100%;
        min-width: unset;
        border-left: none;
        border-top: 1px solid var(--color-border);
      }
    }
  `,
})
export class RequestSidebar {
  readonly request = input.required<CredentialRequest>();

  protected formatStatus(status: string): string {
    const map: Record<string, string> = {
      invited: 'Invited',
      pending: 'Pending',
      submitted: 'Submitted',
    };
    return map[status] ?? status;
  }
}
