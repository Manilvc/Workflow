import { Component, input } from '@angular/core';
import { WorkflowStage } from '../../models/workflow.model';

@Component({
  selector: 'app-workflow-preview',
  template: `
    <div class="preview-panel">
      <div class="preview-header">
        <span class="material-icons-outlined">visibility</span>
        <span>Live Preview</span>
      </div>

      <div class="timeline">
        <!-- Request Created -->
        <div class="timeline-node node-start">
          <div class="node-dot start"></div>
          <div class="node-content">
            <div class="node-label">Request Created</div>
          </div>
        </div>
        <div class="timeline-connector"></div>

        @for (stage of stages(); track stage.id; let i = $index) {
          <div class="timeline-node" [class.node-data]="stage.type === 'data_collection'" [class.node-approval]="stage.type === 'approval'">
            <div class="node-dot" [class.data]="stage.type === 'data_collection'" [class.approval]="stage.type === 'approval'">
              <span class="material-icons-outlined" style="font-size: 12px; color: white;">
                {{ stage.type === 'data_collection' ? 'description' : 'verified' }}
              </span>
            </div>
            <div class="node-content">
              <div class="node-title">{{ stage.name || 'Stage ' + (i + 1) }}</div>
              <div class="node-meta">
                @if (stage.type === 'data_collection') {
                  <span class="type-badge data">Collect Data</span>
                  @if (stage.collectorRole) {
                    <span class="role-label">{{ formatRole(stage.collectorRole) }}</span>
                  }
                  <span class="count-label">{{ stage.fields.length }} field{{ stage.fields.length !== 1 ? 's' : '' }}</span>
                } @else {
                  <span class="type-badge approval">Approval</span>
                  <span class="count-label">{{ stage.approvers.length }} approver{{ stage.approvers.length !== 1 ? 's' : '' }}</span>
                }
              </div>
            </div>
          </div>
          <div class="timeline-connector"></div>
        }

        @if (stages().length === 0) {
          <div class="empty-state">
            <span class="material-icons-outlined">add_circle_outline</span>
            <span>Add stages to see preview</span>
          </div>
          <div class="timeline-connector"></div>
        }

        <!-- Credential Issued -->
        <div class="timeline-node node-end">
          <div class="node-dot end"></div>
          <div class="node-content">
            <div class="node-label">Credential Issued</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .preview-panel {
      width: 280px;
      min-width: 280px;
      background: var(--color-surface);
      border-left: 1px solid var(--color-border);
      padding: 20px;
      overflow-y: auto;
      height: 100%;
    }

    .preview-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 13px;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 24px;

      .material-icons-outlined { font-size: 18px; }
    }

    .timeline {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding-left: 12px;
    }

    .timeline-node {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .node-dot {
      width: 24px;
      height: 24px;
      min-width: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;

      &.start {
        background: var(--color-text-muted);
        border: 3px solid var(--color-border);
        width: 20px;
        height: 20px;
        min-width: 20px;
        margin-left: 2px;
      }

      &.end {
        background: var(--color-primary);
        border: 3px solid var(--color-primary-bg);
        width: 20px;
        height: 20px;
        min-width: 20px;
        margin-left: 2px;
      }

      &.data { background: var(--color-success); }
      &.approval { background: var(--color-primary); }
    }

    .node-content {
      padding-bottom: 4px;
    }

    .node-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-muted);
      padding-top: 2px;
    }

    .node-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 4px;
    }

    .node-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .type-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;

      &.data {
        background: var(--color-success-bg);
        color: var(--color-success);
      }

      &.approval {
        background: var(--color-primary-bg);
        color: var(--color-primary);
      }
    }

    .role-label {
      font-size: 11px;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .count-label {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .timeline-connector {
      width: 2px;
      height: 20px;
      background: var(--color-border);
      margin-left: 11px;
      margin: 4px 0 4px 11px;
    }

    .empty-state {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 0;
      color: var(--color-text-muted);
      font-size: 12px;
      margin-left: 4px;

      .material-icons-outlined { font-size: 16px; }
    }
  `,
})
export class WorkflowPreview {
  readonly stages = input.required<WorkflowStage[]>();

  protected formatRole(role: string): string {
    const map: Record<string, string> = {
      holder: 'Holder',
      issuer: 'Issuer',
      data_collector: 'Data Collector',
    };
    return map[role] ?? role;
  }
}
