import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestService } from '../../services/request.service';
import { NotificationService } from '../../services/notification.service';
import { ProgressTracker } from '../../components/progress-tracker/progress-tracker';
import { StageExecution } from '../../components/stage-execution/stage-execution';
import { RequestSidebar } from '../../components/request-sidebar/request-sidebar';
import { REQUEST_STATUS_CONFIG, RequestStatus, createStageFlowState } from '../../models/workflow.model';

@Component({
  selector: 'app-request-execution',
  imports: [ProgressTracker, StageExecution, RequestSidebar],
  template: `
    @if (requestService.activeRequest(); as request) {
      <div class="execution-layout">
        <!-- Header -->
        <div class="exec-header">
          <div class="header-row">
            <button class="btn btn-ghost back-btn" (click)="goBack()">
              <span class="material-icons-outlined" style="font-size:18px;">arrow_back</span>
              Back to Requests
            </button>
            <div class="header-right-meta">
              <span class="request-id">{{ request.id }}</span>
              <span
                class="status-badge"
                [style.background]="getStatusBg(request.status)"
                [style.color]="getStatusColor(request.status)">
                {{ getStatusLabel(request.status) }}
              </span>
            </div>
          </div>

          <div class="header-main">
            <h1>Create Credential Request</h1>
            <div class="header-meta-tags">
              <span class="meta-tag">
                <span class="material-icons-outlined" style="font-size:14px;">folder</span>
                {{ request.group }}
              </span>
              <span class="meta-tag">
                <span class="material-icons-outlined" style="font-size:14px;">description</span>
                {{ request.subject }}
              </span>
              <span class="meta-tag">
                <span class="material-icons-outlined" style="font-size:14px;">account_tree</span>
                {{ request.workflowName }}
              </span>
            </div>
          </div>
        </div>

        <!-- Progress Tracker -->
        <app-progress-tracker
          [stages]="request.workflow.stages"
          [currentIndex]="request.currentStageIndex" />

        <!-- Main Content Area -->
        <div class="exec-body">
          <!-- Left: Stage Execution (70%) -->
          <div class="exec-main">
            @if (requestService.activeStage(); as stage) {
              @if (getStageFlow(request, stage.id); as flow) {
                <app-stage-execution
                  [stage]="stage"
                  [flow]="flow"
                  [stageIndex]="request.currentStageIndex"
                  [requestId]="request.id"
                  (stageCompleted)="onStageCompleted()" />
              }
            } @else {
              <!-- All stages completed -->
              <div class="completed-section">
                <div class="completed-card card">
                  <div class="completed-icon">
                    <span class="material-icons-outlined" style="font-size:36px; color:white;">workspace_premium</span>
                  </div>
                  <h2>Credential Issued</h2>
                  <p>All workflow stages have been completed successfully.<br/>The verifiable credential has been issued.</p>
                  <div class="completed-actions">
                    <button class="btn btn-primary" (click)="goBack()">
                      <span class="material-icons-outlined" style="font-size:16px;">list_alt</span>
                      View All Requests
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Footer Actions -->
            <div class="footer-bar">
              <button class="btn btn-outline" (click)="goBack()">
                <span class="material-icons-outlined" style="font-size:16px;">close</span>
                Cancel
              </button>
              <div class="footer-right">
                <button class="btn btn-outline" (click)="onSaveDraft()">
                  <span class="material-icons-outlined" style="font-size:16px;">save</span>
                  Save Draft
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Context Sidebar (30%) -->
          <app-request-sidebar [request]="request" />
        </div>
      </div>
    } @else {
      <div class="not-found">
        <div class="not-found-icon">
          <span class="material-icons-outlined" style="font-size:32px; color: var(--color-text-muted);">search_off</span>
        </div>
        <h2>Request Not Found</h2>
        <p>The request you're looking for doesn't exist or has been removed.</p>
        <button class="btn btn-primary" (click)="goBack()">Back to Dashboard</button>
      </div>
    }
  `,
  styles: `
    .execution-layout {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 56px);
      overflow: hidden;
    }

    // Header
    .exec-header {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: 14px 28px 18px;
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .back-btn {
      font-size: 13px;
      color: var(--color-text-secondary);

      &:hover { color: var(--color-primary); }
    }

    .header-right-meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .request-id {
      font-size: 11px;
      font-weight: 600;
      font-family: monospace;
      color: var(--color-text-muted);
      padding: 2px 8px;
      background: var(--color-bg);
      border-radius: var(--radius-sm);
    }

    .status-badge {
      padding: 3px 12px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .header-main {
      h1 {
        font-size: 20px;
        font-weight: 700;
        color: var(--color-text);
        margin-bottom: 8px;
      }
    }

    .header-meta-tags {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--color-text-secondary);
      padding: 3px 10px;
      background: var(--color-bg);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border-light);
    }

    // Body
    .exec-body {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .exec-main {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    // Footer
    .footer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      border-top: 1px solid var(--color-border-light);
      margin-top: auto;
    }

    .footer-right {
      display: flex;
      gap: 8px;
    }

    // Completed
    .completed-section {
      display: flex;
      justify-content: center;
      padding: 32px 0;
    }

    .completed-card {
      text-align: center;
      padding: 48px 56px;
      max-width: 480px;
    }

    .completed-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-success), #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .completed-card h2 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .completed-card p {
      font-size: 13px;
      color: var(--color-text-muted);
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .completed-actions {
      display: flex;
      justify-content: center;
      gap: 10px;
    }

    // Not found
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: calc(100vh - 56px);
      gap: 10px;
    }

    .not-found-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--color-bg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .not-found h2 { font-size: 18px; font-weight: 700; }
    .not-found p { font-size: 13px; color: var(--color-text-muted); margin-bottom: 8px; }

    @media (max-width: 1024px) {
      .exec-body { flex-direction: column; }
      .exec-main { padding: 16px; }
    }

    @media (max-width: 640px) {
      .exec-header { padding: 12px 16px 14px; }
      .header-main h1 { font-size: 17px; }
    }
  `,
})
export class RequestExecution implements OnInit {
  protected readonly requestService = inject(RequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.requestService.setActiveRequest(id);
    }
  }

  protected getStageFlow(request: { stageFlows: Record<string, any> }, stageId: string) {
    return request.stageFlows[stageId] ?? createStageFlowState(stageId);
  }

  protected goBack(): void {
    this.requestService.clearActiveRequest();
    this.router.navigate(['/requests']);
  }

  protected onStageCompleted(): void {
    this.notificationService.push('Stage Completed', 'Moving to the next stage', 'success');
  }

  protected onSaveDraft(): void {
    this.notificationService.push('Saved', 'Draft saved successfully', 'success');
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
