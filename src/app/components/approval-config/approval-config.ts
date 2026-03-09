import { Component, input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  WorkflowStage,
  APPROVER_ROLES,
  ApprovalMode,
} from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-approval-config',
  imports: [FormsModule],
  template: `
    <div class="config-section">
      <!-- Approval Mode -->
      <div class="mode-selector">
        <label class="form-label">Approval Mode</label>
        <div class="mode-options">
          <button
            class="mode-btn"
            [class.active]="stage().approvalMode === 'sequential'"
            (click)="onModeChange('sequential')">
            <span class="material-icons-outlined" style="font-size:16px;">linear_scale</span>
            Sequential
          </button>
          <button
            class="mode-btn"
            [class.active]="stage().approvalMode === 'parallel'"
            (click)="onModeChange('parallel')">
            <span class="material-icons-outlined" style="font-size:16px;">call_split</span>
            Parallel
          </button>
        </div>
      </div>

      <!-- Approvers List -->
      <div class="approvers-section">
        <div class="approvers-header">
          <span class="section-label">Approvers</span>
          <span class="approver-count">{{ stage().approvers.length }} approver{{ stage().approvers.length !== 1 ? 's' : '' }}</span>
        </div>

        @if (stage().approvers.length > 0) {
          <div class="approvers-list">
            @for (approver of stage().approvers; track approver.id; let ai = $index) {
              <div class="approver-row">
                <div class="approver-order">{{ ai + 1 }}</div>
                <select
                  class="form-select approver-role"
                  [ngModel]="approver.role"
                  (ngModelChange)="onApproverRoleChange(approver.id, $event)">
                  <option value="" disabled>Select approver role...</option>
                  @for (role of approverRoles; track role) {
                    <option [value]="role">{{ role }}</option>
                  }
                </select>
                <div class="approver-required">
                  <label class="toggle-wrap">
                    <input
                      type="checkbox"
                      [checked]="approver.required"
                      (change)="onApproverRequiredChange(approver.id, $event)" />
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="req-label">{{ approver.required ? 'Required' : 'Optional' }}</span>
                </div>
                <button class="btn-icon" (click)="onRemoveApprover(approver.id)">
                  <span class="material-icons-outlined" style="font-size:16px; color: var(--color-danger);">delete_outline</span>
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="empty-approvers">
            <span class="material-icons-outlined">person_add</span>
            <span>No approvers added yet</span>
          </div>
        }

        <button class="btn btn-outline" (click)="onAddApprover()">
          <span class="material-icons-outlined" style="font-size:16px;">add</span>
          Add Approver
        </button>
      </div>
    </div>
  `,
  styles: `
    .config-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .mode-selector {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mode-options {
      display: flex;
      gap: 8px;
    }

    .mode-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-weight: 500;
      font-size: 13px;
      color: var(--color-text-secondary);
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--color-primary-light);
        color: var(--color-primary);
      }

      &.active {
        border-color: var(--color-primary);
        background: var(--color-primary-bg);
        color: var(--color-primary);
      }
    }

    .approvers-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .approvers-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .approver-count {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .approvers-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .approver-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--color-bg);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-md);
    }

    .approver-order {
      width: 24px;
      height: 24px;
      min-width: 24px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }

    .approver-role {
      flex: 1;
      padding: 6px 8px;
      font-size: 13px;
    }

    .approver-required {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .req-label {
      font-size: 11px;
      color: var(--color-text-muted);
      min-width: 52px;
    }

    .toggle-wrap {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;

      input {
        opacity: 0;
        width: 0;
        height: 0;
      }
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: var(--color-border);
      border-radius: 10px;
      transition: var(--transition-fast);

      &::before {
        content: '';
        position: absolute;
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background: white;
        border-radius: 50%;
        transition: var(--transition-fast);
      }
    }

    input:checked + .toggle-slider {
      background: var(--color-primary);

      &::before { transform: translateX(16px); }
    }

    .empty-approvers {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: var(--color-bg);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      font-size: 13px;

      .material-icons-outlined { font-size: 18px; }
    }
  `,
})
export class ApprovalConfig {
  readonly stage = input.required<WorkflowStage>();
  protected readonly approverRoles = APPROVER_ROLES;
  private readonly workflowService = inject(WorkflowService);

  protected onModeChange(mode: ApprovalMode): void {
    this.workflowService.setApprovalMode(this.stage().id, mode);
  }

  protected onAddApprover(): void {
    this.workflowService.addApprover(this.stage().id);
  }

  protected onApproverRoleChange(approverId: string, role: string): void {
    this.workflowService.updateApprover(this.stage().id, approverId, { role });
  }

  protected onApproverRequiredChange(approverId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.workflowService.updateApprover(this.stage().id, approverId, { required: checked });
  }

  protected onRemoveApprover(approverId: string): void {
    this.workflowService.removeApprover(this.stage().id, approverId);
  }
}
