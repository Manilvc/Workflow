import { Component, input, output } from '@angular/core';
import { WorkflowStage, StageFlowState, WORKFLOW_ROLES } from '../../models/workflow.model';
import { HolderStageForm } from '../request/holder-stage-form';
import { IssuerStageForm } from '../request/issuer-stage-form';
import { CollectorStageForm } from '../request/collector-stage-form';
import { ApprovalStageForm } from '../request/approval-stage-form';

/**
 * Orchestrator component that dispatches to the correct role-specific form
 * based on stage type and collector role — matching the flowchart branching.
 */
@Component({
  selector: 'app-stage-execution',
  imports: [HolderStageForm, IssuerStageForm, CollectorStageForm, ApprovalStageForm],
  template: `
    <div class="stage-execution">
      <!-- Stage Header Card -->
      <div class="stage-header card">
        <div class="header-top">
          <div class="badge-row">
            <div class="stage-number">Stage {{ stageIndex() + 1 }}</div>
            <span class="type-badge" [class.data]="stage().type === 'data_collection'" [class.approval]="stage().type === 'approval'">
              <span class="material-icons-outlined" style="font-size:14px;">
                {{ stage().type === 'data_collection' ? 'description' : 'verified' }}
              </span>
              {{ stage().type === 'data_collection' ? 'Data Collection' : 'Approval' }}
            </span>
            @if (stage().type === 'data_collection' && stage().collectorRole) {
              <span class="role-badge" [class]="'role-' + stage().collectorRole">
                {{ getRoleLabel(stage().collectorRole!) }}
              </span>
            }
          </div>
        </div>
        <h2 class="stage-title">{{ stage().name }}</h2>
        @if (stage().description) {
          <p class="stage-desc">{{ stage().description }}</p>
        }

        <!-- Flow indicator showing which path we're on -->
        @if (stage().type === 'data_collection') {
          <div class="flow-indicator">
            <div class="flow-path">
              <span class="material-icons-outlined" style="font-size:14px;">account_tree</span>
              <span>Current path:</span>
              <strong>{{ getFlowPath() }}</strong>
            </div>
          </div>
        }
      </div>

      <!-- Role-specific form — dispatched based on stage config -->
      <div class="stage-form-container">
        @if (stage().type === 'data_collection') {
          @switch (stage().collectorRole) {
            @case ('holder') {
              <app-holder-stage-form
                [stage]="stage()"
                [flow]="flow()"
                [requestId]="requestId()"
                (stageCompleted)="stageCompleted.emit()" />
            }
            @case ('issuer') {
              <app-issuer-stage-form
                [stage]="stage()"
                [flow]="flow()"
                [requestId]="requestId()"
                (stageCompleted)="stageCompleted.emit()" />
            }
            @case ('data_collector') {
              <app-collector-stage-form
                [stage]="stage()"
                [flow]="flow()"
                [requestId]="requestId()"
                (stageCompleted)="stageCompleted.emit()" />
            }
          }
        } @else if (stage().type === 'approval') {
          <app-approval-stage-form
            [stage]="stage()"
            [flow]="flow()"
            [requestId]="requestId()"
            (stageCompleted)="stageCompleted.emit()" />
        }
      </div>
    </div>
  `,
  styles: `
    .stage-execution {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .stage-header {
      padding: 20px 24px;
    }

    .header-top {
      margin-bottom: 10px;
    }

    .badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .stage-number {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 2px 10px;
      background: var(--color-bg);
      border-radius: 100px;
    }

    .type-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 100px;

      &.data { background: var(--color-success-bg); color: var(--color-success); }
      &.approval { background: var(--color-purple-bg); color: var(--color-purple); }
    }

    .role-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 100px;

      &.role-holder { background: var(--color-primary-bg); color: var(--color-primary); }
      &.role-issuer { background: var(--color-purple-bg); color: var(--color-purple); }
      &.role-data_collector { background: var(--color-warning-bg); color: var(--color-warning); }
    }

    .stage-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 4px;
    }

    .stage-desc {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }

    .flow-indicator {
      margin-top: 8px;
      padding: 8px 12px;
      background: var(--color-bg);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-light);
    }

    .flow-path {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--color-text-secondary);

      strong { color: var(--color-text); }
    }

    .stage-form-container {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-sm);
    }
  `,
})
export class StageExecution {
  readonly stage = input.required<WorkflowStage>();
  readonly flow = input.required<StageFlowState>();
  readonly stageIndex = input.required<number>();
  readonly requestId = input.required<string>();
  readonly stageCompleted = output<void>();

  protected getRoleLabel(role: string): string {
    return WORKFLOW_ROLES.find(r => r.value === role)?.label ?? role;
  }

  protected getFlowPath(): string {
    const role = this.stage().collectorRole;
    const flow = this.flow();

    if (role === 'holder') {
      if (flow.status === 'collecting_info') return 'Holder → Add name & email';
      if (flow.status === 'request_sent') return 'Holder → Request sent → Waiting';
      return 'Holder → Completed';
    }

    if (role === 'issuer') {
      if (flow.status === 'deciding_issuer') return 'Issuer → Deciding: Is issuer same?';
      if (flow.status === 'filling_form_self') return 'Issuer → Yes → Fill form directly';
      if (flow.status === 'collecting_info') return 'Issuer → No → Enter issuer details';
      if (flow.status === 'request_sent') return 'Issuer → No → Request sent → Waiting';
      return 'Issuer → Completed';
    }

    if (role === 'data_collector') {
      if (flow.status === 'collecting_info') return 'Data Collector → Add name & email';
      if (flow.status === 'request_sent') return 'Data Collector → Request sent → Waiting';
      return 'Data Collector → Completed';
    }

    return 'Unknown';
  }
}
