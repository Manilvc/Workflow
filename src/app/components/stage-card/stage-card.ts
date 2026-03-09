import { Component, input, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkflowStage, StageType } from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';
import { DataCollectionConfig } from '../data-collection-config/data-collection-config';
import { ApprovalConfig } from '../approval-config/approval-config';

@Component({
  selector: 'app-stage-card',
  imports: [FormsModule, DataCollectionConfig, ApprovalConfig],
  template: `
    <div class="stage-card card" [class.collapsed]="stage().collapsed">
      <!-- Header -->
      <div class="stage-header" (click)="onToggleCollapse()">
        <div class="header-left">
          <span class="drag-handle material-icons-outlined" (click)="$event.stopPropagation()">drag_indicator</span>
          <div class="stage-badge" [class.data]="stage().type === 'data_collection'" [class.approval]="stage().type === 'approval'">
            <span class="material-icons-outlined" style="font-size:14px;">
              {{ stage().type === 'data_collection' ? 'description' : 'verified' }}
            </span>
          </div>
          <div class="header-info">
            <span class="stage-index">Stage {{ index() + 1 }}</span>
            <span class="stage-name">{{ stage().name || 'Untitled Stage' }}</span>
          </div>
        </div>
        <div class="header-right">
          <span class="type-pill" [class.data]="stage().type === 'data_collection'" [class.approval]="stage().type === 'approval'">
            {{ stage().type === 'data_collection' ? 'Data Collection' : 'Approval' }}
          </span>
          <div class="header-actions" (click)="$event.stopPropagation()">
            <button class="btn-icon" [disabled]="index() === 0" (click)="moveUp.emit()">
              <span class="material-icons-outlined" style="font-size:18px;">keyboard_arrow_up</span>
            </button>
            <button class="btn-icon" [disabled]="index() === totalStages() - 1" (click)="moveDown.emit()">
              <span class="material-icons-outlined" style="font-size:18px;">keyboard_arrow_down</span>
            </button>
            <button class="btn-icon delete-btn" (click)="remove.emit()">
              <span class="material-icons-outlined" style="font-size:18px;">delete_outline</span>
            </button>
          </div>
          <span class="material-icons-outlined chevron">
            {{ stage().collapsed ? 'expand_more' : 'expand_less' }}
          </span>
        </div>
      </div>

      <!-- Body -->
      @if (!stage().collapsed) {
        <div class="stage-body">
          <!-- Stage Name -->
          <div class="form-group">
            <label class="form-label">Stage Name *</label>
            <input
              class="form-input"
              type="text"
              placeholder="e.g., Applicant Data Submission"
              [ngModel]="stage().name"
              (ngModelChange)="onNameChange($event)" />
          </div>

          <!-- Stage Type Selection -->
          <div class="type-selector">
            <label class="form-label">Stage Type *</label>
            <div class="type-options">
              <button
                class="type-option"
                [class.active]="stage().type === 'data_collection'"
                (click)="onTypeChange('data_collection')">
                <span class="material-icons-outlined type-icon data-icon">description</span>
                <div class="type-text">
                  <span class="type-title">Collect Data</span>
                  <span class="type-desc">Gather information from a role</span>
                </div>
              </button>
              <button
                class="type-option"
                [class.active]="stage().type === 'approval'"
                (click)="onTypeChange('approval')">
                <span class="material-icons-outlined type-icon approval-icon">verified</span>
                <div class="type-text">
                  <span class="type-title">Approval</span>
                  <span class="type-desc">Require sign-off from approvers</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Configuration based on type -->
          <div class="config-container">
            @if (stage().type === 'data_collection') {
              <app-data-collection-config [stage]="stage()" />
            } @else {
              <app-approval-config [stage]="stage()" />
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .stage-card {
      overflow: hidden;
      transition: all var(--transition-normal);

      &:hover {
        box-shadow: var(--shadow-md);
      }
    }

    .stage-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      cursor: pointer;
      user-select: none;
      transition: background var(--transition-fast);

      &:hover { background: var(--color-bg); }
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .drag-handle {
      cursor: grab;
      color: var(--color-text-muted);
      font-size: 18px;

      &:active { cursor: grabbing; }
      &:hover { color: var(--color-text-secondary); }
    }

    .stage-badge {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      &.data { background: var(--color-success); }
      &.approval { background: var(--color-primary); }
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .stage-index {
      font-size: 10px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .stage-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .type-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 100px;
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

    .header-actions {
      display: flex;
      gap: 2px;
    }

    .btn-icon {
      padding: 4px;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      transition: all var(--transition-fast);

      &:hover:not(:disabled) {
        background: var(--color-hover);
        color: var(--color-text);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .delete-btn:hover:not(:disabled) {
      color: var(--color-danger) !important;
      background: var(--color-danger-bg) !important;
    }

    .chevron {
      color: var(--color-text-muted);
      font-size: 20px;
      transition: transform var(--transition-fast);
    }

    .stage-body {
      padding: 0 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-top: 1px solid var(--color-border-light);
      padding-top: 16px;
    }

    .type-selector {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .type-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .type-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      text-align: left;
      transition: all var(--transition-fast);
      background: var(--color-surface);

      &:hover {
        border-color: var(--color-primary-light);
      }

      &.active {
        border-color: var(--color-primary);
        background: var(--color-primary-bg);
      }
    }

    .type-icon {
      font-size: 22px;

      &.data-icon { color: var(--color-success); }
      &.approval-icon { color: var(--color-primary); }
    }

    .type-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .type-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
    }

    .type-desc {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .config-container {
      padding-top: 4px;
    }
  `,
})
export class StageCard {
  readonly stage = input.required<WorkflowStage>();
  readonly index = input.required<number>();
  readonly totalStages = input.required<number>();

  readonly moveUp = output<void>();
  readonly moveDown = output<void>();
  readonly remove = output<void>();

  private readonly workflowService = inject(WorkflowService);

  protected onToggleCollapse(): void {
    this.workflowService.toggleStageCollapse(this.stage().id);
  }

  protected onNameChange(name: string): void {
    this.workflowService.updateStage(this.stage().id, { name });
  }

  protected onTypeChange(type: StageType): void {
    this.workflowService.setStageType(this.stage().id, type);
  }
}
