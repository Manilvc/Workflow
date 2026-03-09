import { Component, inject } from '@angular/core';
import { CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { WorkflowService } from '../../services/workflow.service';
import { StageCard } from '../stage-card/stage-card';

@Component({
  selector: 'app-stage-builder',
  imports: [StageCard, CdkDrag, CdkDropList],
  template: `
    <div class="builder-section">
      <div class="section-header">
        <div class="section-title">
          <span class="material-icons-outlined">layers</span>
          Stages
        </div>
        <div class="section-actions">
          @if (workflowService.stages().length > 0) {
            <span class="stage-count">{{ workflowService.stages().length }} stage{{ workflowService.stages().length !== 1 ? 's' : '' }}</span>
          }
          <button class="btn btn-primary btn-sm" (click)="onAddStage()">
            <span class="material-icons-outlined" style="font-size:16px;">add</span>
            Add Stage
          </button>
        </div>
      </div>

      @if (workflowService.stages().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <span class="material-icons-outlined">add_circle_outline</span>
          </div>
          <h3>No stages yet</h3>
          <p>Add your first stage to start building the workflow</p>
          <button class="btn btn-primary" (click)="onAddStage()">
            <span class="material-icons-outlined" style="font-size:16px;">add</span>
            Add First Stage
          </button>
        </div>
      } @else {
        <div
          cdkDropList
          class="stages-list"
          (cdkDropListDropped)="onDrop($event)">
          @for (stage of workflowService.stages(); track stage.id; let i = $index) {
            <div cdkDrag class="drag-item">
              <app-stage-card
                [stage]="stage"
                [index]="i"
                [totalStages]="workflowService.stages().length"
                (moveUp)="workflowService.moveStageUp(stage.id)"
                (moveDown)="workflowService.moveStageDown(stage.id)"
                (remove)="workflowService.removeStage(stage.id)" />
            </div>
          }
        </div>
      }

      <!-- Validation Errors -->
      @if (workflowService.validationErrors().length > 0 && workflowService.stages().length > 0) {
        <div class="validation-panel">
          <div class="validation-header">
            <span class="material-icons-outlined" style="font-size:16px; color: var(--color-warning);">warning</span>
            <span>Validation Issues</span>
          </div>
          @for (error of workflowService.validationErrors(); track error) {
            <div class="validation-item">{{ error }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .builder-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 15px;

      .material-icons-outlined {
        font-size: 20px;
        color: var(--color-primary);
      }
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stage-count {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .stages-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .drag-item {
      cursor: default;
    }

    .cdk-drag-preview {
      box-shadow: var(--shadow-xl);
      border-radius: var(--radius-lg);
      opacity: 0.9;
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 48px 24px;
      background: var(--color-surface);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      text-align: center;

      .empty-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--color-primary-bg);
        display: flex;
        align-items: center;
        justify-content: center;

        .material-icons-outlined {
          font-size: 24px;
          color: var(--color-primary);
        }
      }

      h3 {
        font-size: 15px;
        font-weight: 600;
        color: var(--color-text);
      }

      p {
        font-size: 13px;
        color: var(--color-text-muted);
        max-width: 260px;
      }
    }

    .validation-panel {
      padding: 12px 14px;
      background: var(--color-warning-bg);
      border: 1px solid #fde68a;
      border-radius: var(--radius-md);
    }

    .validation-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-warning);
      margin-bottom: 8px;
    }

    .validation-item {
      font-size: 12px;
      color: var(--color-text-secondary);
      padding: 2px 0 2px 22px;
      position: relative;

      &::before {
        content: '•';
        position: absolute;
        left: 10px;
        color: var(--color-warning);
      }
    }
  `,
})
export class StageBuilder {
  protected readonly workflowService = inject(WorkflowService);

  protected onAddStage(): void {
    this.workflowService.addStage();
  }

  protected onDrop(event: CdkDragDrop<unknown>): void {
    this.workflowService.reorderStages(event.previousIndex, event.currentIndex);
  }
}
