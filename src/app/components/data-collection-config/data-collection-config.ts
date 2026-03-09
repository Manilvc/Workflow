import { Component, input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  WorkflowStage,
  WORKFLOW_ROLES,
  FIELD_TYPES,
  WorkflowRole,
  FieldInputType,
} from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-data-collection-config',
  imports: [FormsModule],
  template: `
    <div class="config-section">
      <!-- Role Selector -->
      <div class="role-selector">
        <div class="form-group">
          <label class="form-label">Data Collected By *</label>
          <select
            class="form-select"
            [ngModel]="stage().collectorRole ?? ''"
            (ngModelChange)="onRoleChange($event)">
            <option value="" disabled>Select a role...</option>
            @for (role of roles; track role.value) {
              <option [value]="role.value">{{ role.label }}</option>
            }
          </select>
        </div>
        @if (stage().collectorRole) {
          <div class="role-info">
            <span class="material-icons-outlined" style="font-size:14px; color: var(--color-success);">check_circle</span>
            <span>All fields in this stage belong to <strong>{{ formatRole(stage().collectorRole!) }}</strong></span>
          </div>
        }
      </div>

      <!-- Fields List -->
      @if (stage().collectorRole) {
        <div class="fields-section">
          <div class="fields-header">
            <span class="section-label">Collection Fields</span>
            <span class="field-count">{{ stage().fields.length }} field{{ stage().fields.length !== 1 ? 's' : '' }}</span>
          </div>

          @if (stage().fields.length > 0) {
            <div class="fields-table">
              <div class="fields-table-header">
                <span class="col-name">Field Name</span>
                <span class="col-type">Input Type</span>
                <span class="col-req">Required</span>
                <span class="col-actions"></span>
              </div>
              @for (field of stage().fields; track field.id; let fi = $index) {
                <div class="field-row">
                  <input
                    class="form-input col-name"
                    type="text"
                    placeholder="e.g., Full Name"
                    [ngModel]="field.name"
                    (ngModelChange)="onFieldNameChange(field.id, $event)" />
                  <select
                    class="form-select col-type"
                    [ngModel]="field.inputType"
                    (ngModelChange)="onFieldTypeChange(field.id, $event)">
                    @for (ft of fieldTypes; track ft.value) {
                      <option [value]="ft.value">{{ ft.label }}</option>
                    }
                  </select>
                  <label class="toggle-wrap col-req">
                    <input
                      type="checkbox"
                      [checked]="field.required"
                      (change)="onFieldRequiredChange(field.id, $event)" />
                    <span class="toggle-slider"></span>
                  </label>
                  <button class="btn-icon col-actions" (click)="onRemoveField(field.id)">
                    <span class="material-icons-outlined" style="font-size:16px; color: var(--color-danger);">delete_outline</span>
                  </button>
                </div>
              }
            </div>
          }

          <button class="btn btn-outline add-field-btn" (click)="onAddField()">
            <span class="material-icons-outlined" style="font-size:16px;">add</span>
            Add Field
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .config-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .role-selector {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .role-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--color-text-secondary);
      padding: 8px 12px;
      background: var(--color-success-bg);
      border-radius: var(--radius-md);
    }

    .fields-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .fields-header {
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

    .field-count {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .fields-table {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .fields-table-header {
      display: grid;
      grid-template-columns: 1fr 140px 60px 36px;
      gap: 8px;
      padding: 8px 12px;
      background: var(--color-bg);
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--color-border);
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 140px 60px 36px;
      gap: 8px;
      padding: 8px 12px;
      align-items: center;
      border-bottom: 1px solid var(--color-border-light);

      &:last-child { border-bottom: none; }

      .form-input,
      .form-select {
        padding: 6px 8px;
        font-size: 13px;
      }
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

    .add-field-btn {
      align-self: flex-start;
    }
  `,
})
export class DataCollectionConfig {
  readonly stage = input.required<WorkflowStage>();
  protected readonly roles = WORKFLOW_ROLES;
  protected readonly fieldTypes = FIELD_TYPES;
  private readonly workflowService = inject(WorkflowService);

  protected formatRole(role: string): string {
    return WORKFLOW_ROLES.find(r => r.value === role)?.label ?? role;
  }

  protected onRoleChange(role: string): void {
    this.workflowService.setStageRole(this.stage().id, role as WorkflowRole);
  }

  protected onAddField(): void {
    this.workflowService.addField(this.stage().id);
  }

  protected onFieldNameChange(fieldId: string, name: string): void {
    this.workflowService.updateField(this.stage().id, fieldId, { name });
  }

  protected onFieldTypeChange(fieldId: string, inputType: string): void {
    this.workflowService.updateField(this.stage().id, fieldId, { inputType: inputType as FieldInputType });
  }

  protected onFieldRequiredChange(fieldId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.workflowService.updateField(this.stage().id, fieldId, { required: checked });
  }

  protected onRemoveField(fieldId: string): void {
    this.workflowService.removeField(this.stage().id, fieldId);
  }
}
