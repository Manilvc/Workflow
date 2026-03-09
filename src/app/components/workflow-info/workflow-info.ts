import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '../../services/workflow.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-workflow-info',
  imports: [FormsModule],
  template: `
    <div class="info-card card">
      <div class="info-header">
        <div class="info-title">
          <span class="material-icons-outlined">info</span>
          Workflow Information
        </div>
        <button
          class="btn btn-primary"
          (click)="onSave()"
          [disabled]="!workflowService.workflow().name.trim()">
          <span class="material-icons-outlined" style="font-size:16px;">save</span>
          Save Workflow
        </button>
      </div>
      <div class="info-body">
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Workflow Name *</label>
            <input
              class="form-input"
              type="text"
              placeholder="e.g., Retail License Workflow"
              [ngModel]="workflowService.workflow().name"
              (ngModelChange)="onNameChange($event)" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            class="form-textarea"
            placeholder="Describe what this workflow does..."
            [ngModel]="workflowService.workflow().description"
            (ngModelChange)="onDescriptionChange($event)">
          </textarea>
        </div>
      </div>
    </div>
  `,
  styles: `
    .info-card {
      padding: 20px;
    }

    .info-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .info-title {
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

    .info-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-row {
      display: flex;
      gap: 14px;
    }

    .flex-1 { flex: 1; }
  `,
})
export class WorkflowInfo {
  protected readonly workflowService = inject(WorkflowService);
  private readonly notificationService = inject(NotificationService);

  private currentName = '';
  private currentDesc = '';

  protected onNameChange(name: string): void {
    this.currentName = name;
    this.workflowService.updateWorkflowInfo(name, this.workflowService.workflow().description);
  }

  protected onDescriptionChange(description: string): void {
    this.currentDesc = description;
    this.workflowService.updateWorkflowInfo(this.workflowService.workflow().name, description);
  }

  protected onSave(): void {
    this.workflowService.saveWorkflow();
    this.notificationService.push('Saved', 'Workflow saved successfully', 'success');
  }
}
