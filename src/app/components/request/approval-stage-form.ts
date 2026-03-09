import { Component, input, output, inject } from '@angular/core';
import { WorkflowStage, StageFlowState } from '../../models/workflow.model';
import { RequestService } from '../../services/request.service';

/**
 * Approval stage flow:
 *  1. Show list of approvers
 *  2. If current user is approver → Approve / Reject / Request Changes
 *  3. If not → "Waiting for Approval"
 */
@Component({
  selector: 'app-approval-stage-form',
  template: `
    <div class="approval-flow">

      @if (flow().status === 'pending_approval') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot approval-dot">
              <span class="material-icons-outlined" style="font-size:12px; color:white;">verified</span>
            </div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <div class="step-header">
              <span class="material-icons-outlined step-icon">verified_user</span>
              <h3>Approval Required</h3>
            </div>
            <p class="step-desc">This stage requires approval from the designated approvers before proceeding.</p>

            <!-- Approvers List -->
            <div class="approvers-list">
              @for (approver of stage().approvers; track approver.id; let i = $index) {
                <div class="approver-card">
                  <div class="approver-order">{{ i + 1 }}</div>
                  <div class="approver-avatar">{{ approver.role.charAt(0) }}</div>
                  <div class="approver-info">
                    <span class="approver-name">{{ approver.role }}</span>
                    <span class="approver-type" [class.required]="approver.required">
                      {{ approver.required ? 'Required' : 'Optional' }}
                    </span>
                  </div>
                  <span class="badge badge-yellow">Pending</span>
                </div>
              }
            </div>

            <!-- Mode indicator -->
            <div class="mode-info">
              <span class="material-icons-outlined" style="font-size:14px;">info</span>
              <span>Approval mode: <strong>{{ stage().approvalMode === 'sequential' ? 'Sequential' : 'Parallel' }}</strong></span>
            </div>

            <!-- Actions (if current user is an approver) -->
            <div class="action-section">
              <div class="action-label">You are an approver for this stage</div>
              <div class="action-buttons">
                <button class="btn btn-success" (click)="onApprove()">
                  <span class="material-icons-outlined" style="font-size:16px;">check_circle</span>
                  Approve
                </button>
                <button class="btn btn-danger" (click)="onReject()">
                  <span class="material-icons-outlined" style="font-size:16px;">cancel</span>
                  Reject
                </button>
                <button class="btn btn-outline" (click)="onRequestChanges()">
                  <span class="material-icons-outlined" style="font-size:16px;">edit</span>
                  Request Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (flow().status === 'approved' || flow().status === 'completed') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot completed">
              <span class="material-icons-outlined" style="font-size:12px;">check</span>
            </div>
          </div>
          <div class="step-content">
            <div class="complete-card">
              <span class="material-icons-outlined" style="font-size:20px; color: var(--color-success);">verified</span>
              <div>
                <h4>Stage Approved</h4>
                <p>All required approvers have signed off. Moving to next stage.</p>
              </div>
            </div>
          </div>
        </div>
      }

      @if (flow().status === 'rejected') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot rejected">
              <span class="material-icons-outlined" style="font-size:12px;">close</span>
            </div>
          </div>
          <div class="step-content">
            <div class="rejected-card">
              <span class="material-icons-outlined" style="font-size:20px; color: var(--color-danger);">cancel</span>
              <div>
                <h4>Stage Rejected</h4>
                <p>This stage has been rejected. The request cannot proceed.</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .approval-flow { display: flex; flex-direction: column; }
    .flow-step { display: flex; gap: 16px; padding-bottom: 8px; }

    .step-indicator {
      display: flex; flex-direction: column; align-items: center; min-width: 24px;
    }

    .step-dot {
      width: 24px; height: 24px; border-radius: 50%;
      border: 2px solid var(--color-border); background: var(--color-surface);
      display: flex; align-items: center; justify-content: center; z-index: 1;
      &.approval-dot { border-color: var(--color-purple); background: var(--color-purple); }
      &.completed { border-color: var(--color-success); background: var(--color-success); color: white; }
      &.rejected { border-color: var(--color-danger); background: var(--color-danger); color: white; }
    }

    .step-line {
      width: 2px; flex: 1; min-height: 20px;
      background: var(--color-border); margin-top: 4px;
    }

    .step-content { flex: 1; padding-bottom: 16px; }

    .step-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
      h3 { font-size: 15px; font-weight: 600; }
    }

    .step-icon { font-size: 20px; color: var(--color-purple); }
    .step-desc { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 16px; }

    .approvers-list {
      display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;
    }

    .approver-card {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; background: var(--color-bg);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-md);
    }

    .approver-order {
      width: 24px; height: 24px; min-width: 24px; border-radius: 50%;
      background: var(--color-purple); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
    }

    .approver-avatar {
      width: 32px; height: 32px; min-width: 32px; border-radius: 50%;
      background: var(--color-purple-bg); color: var(--color-purple);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px;
    }

    .approver-info { flex: 1; }
    .approver-name { font-size: 13px; font-weight: 600; display: block; }
    .approver-type {
      font-size: 11px; color: var(--color-text-muted);
      &.required { color: var(--color-danger); font-weight: 600; }
    }

    .mode-info {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--color-text-secondary);
      padding: 8px 12px; background: var(--color-bg);
      border-radius: var(--radius-md); margin-bottom: 16px;
    }

    .action-section {
      padding: 16px; background: var(--color-primary-bg);
      border: 1px solid #bfdbfe; border-radius: var(--radius-lg);
    }

    .action-label {
      font-size: 12px; font-weight: 600; color: var(--color-primary);
      margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.04em;
    }

    .action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }

    .complete-card {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 18px; background: var(--color-success-bg);
      border: 1px solid #a7f3d0; border-radius: var(--radius-lg);
      h4 { font-size: 14px; font-weight: 600; }
      p { font-size: 12px; color: var(--color-text-secondary); margin-top: 1px; }
    }

    .rejected-card {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 18px; background: var(--color-danger-bg);
      border: 1px solid #fecaca; border-radius: var(--radius-lg);
      h4 { font-size: 14px; font-weight: 600; }
      p { font-size: 12px; color: var(--color-text-secondary); margin-top: 1px; }
    }
  `,
})
export class ApprovalStageForm {
  readonly stage = input.required<WorkflowStage>();
  readonly flow = input.required<StageFlowState>();
  readonly requestId = input.required<string>();
  readonly stageCompleted = output<void>();

  private readonly requestService = inject(RequestService);

  protected onApprove(): void {
    this.requestService.approveStage(this.requestId(), this.stage().id);
  }

  protected onReject(): void {
    this.requestService.rejectStage(this.requestId(), this.stage().id);
  }

  protected onRequestChanges(): void {
    // placeholder — would send back for revisions
  }
}
