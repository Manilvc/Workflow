import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../../services/request.service';
import { NotificationService } from '../../services/notification.service';
import { WorkflowService } from '../../services/workflow.service';
import { REQUEST_STATUS_CONFIG, RequestStatus } from '../../models/workflow.model';

@Component({
  selector: 'app-request-dashboard',
  imports: [DatePipe, FormsModule],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <div class="dash-header">
        <div class="header-text">
          <h1>Credential Requests</h1>
          <p>Track and manage all credential issuance requests</p>
        </div>
        <button class="btn btn-primary" (click)="onCreateRequest()">
          <span class="material-icons-outlined" style="font-size:16px;">add</span>
          New Request
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-bar card">
        <div class="search-box">
          <span class="material-icons-outlined" style="font-size:18px; color: var(--color-text-muted);">search</span>
          <input
            type="text"
            placeholder="Search requests..."
            class="search-input"
            [(ngModel)]="searchQuery" />
        </div>
        <div class="filter-group">
          <select class="form-select filter-select" [(ngModel)]="statusFilter">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="waiting_for_holder">Waiting for Holder</option>
            <option value="waiting_for_issuer">Waiting for Issuer</option>
            <option value="approval_pending">Approval Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card card">
          <div class="stat-icon" style="background: var(--color-primary-bg);">
            <span class="material-icons-outlined" style="color: var(--color-primary);">list_alt</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ requestService.requests().length }}</div>
            <div class="stat-label">Total Requests</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon" style="background: var(--color-warning-bg);">
            <span class="material-icons-outlined" style="color: var(--color-warning);">hourglass_empty</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ countByStatus('pending') + countByStatus('waiting_for_holder') + countByStatus('waiting_for_issuer') }}</div>
            <div class="stat-label">In Progress</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon" style="background: var(--color-purple-bg);">
            <span class="material-icons-outlined" style="color: var(--color-purple);">verified</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ countByStatus('approval_pending') }}</div>
            <div class="stat-label">Awaiting Approval</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon" style="background: var(--color-success-bg);">
            <span class="material-icons-outlined" style="color: var(--color-success);">check_circle</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ countByStatus('completed') }}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <!-- Requests Table -->
      <div class="table-container card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Subject</th>
              <th>Workflow</th>
              <th>Current Stage</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (req of filteredRequests(); track req.id) {
              <tr class="table-row" (click)="onOpenRequest(req.id)">
                <td class="id-cell">{{ req.id }}</td>
                <td>
                  <div class="subject-cell">
                    <span class="subject-text">{{ req.subject }}</span>
                    <span class="group-text">{{ req.group }}</span>
                  </div>
                </td>
                <td class="workflow-cell">{{ req.workflowName }}</td>
                <td>
                  @if (req.currentStageIndex < req.workflow.stages.length) {
                    <span class="stage-pill">
                      Stage {{ req.currentStageIndex + 1 }}: {{ req.workflow.stages[req.currentStageIndex].name }}
                    </span>
                  } @else {
                    <span class="stage-pill completed">Completed</span>
                  }
                </td>
                <td class="assigned-cell">{{ req.assignedTo || '—' }}</td>
                <td>
                  <span
                    class="status-badge"
                    [style.background]="getStatusBg(req.status)"
                    [style.color]="getStatusColor(req.status)">
                    {{ getStatusLabel(req.status) }}
                  </span>
                </td>
                <td class="date-cell">{{ req.createdAt | date:'MMM d, yyyy' }}</td>
                <td>
                  <button class="btn-icon">
                    <span class="material-icons-outlined" style="font-size:18px;">chevron_right</span>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-cell">
                  <div class="empty-table">
                    <span class="material-icons-outlined" style="font-size:32px; color: var(--color-text-muted);">inbox</span>
                    <span>No requests found</span>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .dashboard {
      padding: 24px 32px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dash-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;

      h1 {
        font-size: 22px;
        font-weight: 700;
      }

      p {
        font-size: 13px;
        color: var(--color-text-muted);
        margin-top: 2px;
      }
    }

    .filters-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      margin-bottom: 16px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .search-input {
      border: none;
      outline: none;
      background: transparent;
      font-size: 13px;
      width: 100%;
      color: var(--color-text);

      &::placeholder { color: var(--color-text-muted); }
    }

    .filter-select {
      width: 180px;
      padding: 6px 10px;
      font-size: 13px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;

      .material-icons-outlined { font-size: 20px; }
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1;
    }

    .stat-label {
      font-size: 11px;
      color: var(--color-text-muted);
      font-weight: 500;
      margin-top: 2px;
    }

    .table-container {
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th {
        text-align: left;
        padding: 10px 16px;
        font-size: 11px;
        font-weight: 600;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
      }

      td {
        padding: 12px 16px;
        font-size: 13px;
        border-bottom: 1px solid var(--color-border-light);
      }
    }

    .table-row {
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover { background: var(--color-hover); }
    }

    .id-cell {
      font-weight: 600;
      font-family: monospace;
      font-size: 12px;
      color: var(--color-primary);
    }

    .subject-cell {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .subject-text {
      font-weight: 600;
      color: var(--color-text);
    }

    .group-text {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .workflow-cell {
      color: var(--color-text-secondary);
    }

    .stage-pill {
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      background: var(--color-bg);
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);

      &.completed {
        background: var(--color-success-bg);
        color: var(--color-success);
        font-weight: 600;
      }
    }

    .assigned-cell {
      color: var(--color-text-secondary);
    }

    .status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }

    .date-cell {
      color: var(--color-text-muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .empty-cell {
      text-align: center;
      padding: 48px 16px !important;
    }

    .empty-table {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--color-text-muted);
      font-size: 13px;
    }

    @media (max-width: 1024px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .dashboard { padding: 16px; }
      .stats-row { grid-template-columns: 1fr; }
      .filters-bar { flex-direction: column; }
    }
  `,
})
export class RequestDashboard {
  protected readonly requestService = inject(RequestService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly workflowService = inject(WorkflowService);

  protected searchQuery = '';
  protected statusFilter = '';

  protected filteredRequests = signal(this.requestService.requests());

  constructor() {
    // Reactively filter, but for simplicity we use the getter pattern
  }

  protected countByStatus(status: string): number {
    return this.requestService.requests().filter(r => r.status === status).length;
  }

  protected onOpenRequest(requestId: string): void {
    this.router.navigate(['/requests', requestId]);
  }

  protected onCreateRequest(): void {
    const workflow = this.workflowService.workflow();
    if (!workflow.name) {
      this.notificationService.push('No Workflow', 'Create a workflow first in the Builder', 'warning');
      this.router.navigate(['/builder']);
      return;
    }
    const request = this.requestService.createRequest(workflow, 'New Credential', 'Default Group');
    this.notificationService.push('Request Created', `Request ${request.id} created`, 'success');
    this.router.navigate(['/requests', request.id]);
  }

  protected getStatusLabel(status: string): string {
    return REQUEST_STATUS_CONFIG[status as RequestStatus]?.label ?? status;
  }

  protected getStatusColor(status: string): string {
    return REQUEST_STATUS_CONFIG[status as RequestStatus]?.color ?? '#6b7280';
  }

  protected getStatusBg(status: string): string {
    return this.getStatusColor(status) + '18';
  }
}
