import { Injectable, signal, computed } from '@angular/core';
import {
  Workflow,
  WorkflowStage,
  WorkflowField,
  Approver,
  createEmptyWorkflow,
  createEmptyStage,
  createEmptyField,
  createEmptyApprover,
  StageType,
  WorkflowRole,
  ApprovalMode,
  FieldInputType,
} from '../models/workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly _workflow = signal<Workflow>(createEmptyWorkflow());
  private readonly _activeSection = signal<string>('builder');
  private readonly _autoSaveTimer = signal<ReturnType<typeof setTimeout> | null>(null);

  readonly workflow = this._workflow.asReadonly();
  readonly activeSection = this._activeSection.asReadonly();

  readonly stages = computed(() => this._workflow().stages);
  readonly isValid = computed(() => this.validateWorkflow());

  readonly validationErrors = computed(() => {
    const errors: string[] = [];
    const w = this._workflow();
    if (!w.name.trim()) errors.push('Workflow name is required');
    if (w.stages.length === 0) errors.push('At least one stage is required');
    w.stages.forEach((stage, i) => {
      if (!stage.name.trim()) errors.push(`Stage ${i + 1}: Name is required`);
      if (stage.type === 'data_collection') {
        if (!stage.collectorRole) errors.push(`Stage ${i + 1}: Role is required`);
        if (stage.fields.length === 0) errors.push(`Stage ${i + 1}: At least one field is required`);
        stage.fields.forEach((f, fi) => {
          if (!f.name.trim()) errors.push(`Stage ${i + 1}, Field ${fi + 1}: Name is required`);
        });
      }
      if (stage.type === 'approval') {
        if (stage.approvers.length === 0) errors.push(`Stage ${i + 1}: At least one approver is required`);
        stage.approvers.forEach((a, ai) => {
          if (!a.role.trim()) errors.push(`Stage ${i + 1}, Approver ${ai + 1}: Role is required`);
        });
      }
    });
    return errors;
  });

  setActiveSection(section: string): void {
    this._activeSection.set(section);
  }

  updateWorkflowInfo(name: string, description: string): void {
    this._workflow.update(w => ({
      ...w,
      name,
      description,
      updatedAt: new Date(),
    }));
    this.scheduleAutoSave();
  }

  addStage(): void {
    this._workflow.update(w => ({
      ...w,
      stages: [...w.stages, createEmptyStage(w.stages.length)],
      updatedAt: new Date(),
    }));
    this.scheduleAutoSave();
  }

  updateStage(stageId: string, updates: Partial<WorkflowStage>): void {
    this._workflow.update(w => ({
      ...w,
      stages: w.stages.map(s => s.id === stageId ? { ...s, ...updates } : s),
      updatedAt: new Date(),
    }));
    this.scheduleAutoSave();
  }

  removeStage(stageId: string): void {
    this._workflow.update(w => ({
      ...w,
      stages: w.stages.filter(s => s.id !== stageId),
      updatedAt: new Date(),
    }));
    this.scheduleAutoSave();
  }

  moveStageUp(stageId: string): void {
    this._workflow.update(w => {
      const idx = w.stages.findIndex(s => s.id === stageId);
      if (idx <= 0) return w;
      const stages = [...w.stages];
      [stages[idx - 1], stages[idx]] = [stages[idx], stages[idx - 1]];
      return { ...w, stages, updatedAt: new Date() };
    });
    this.scheduleAutoSave();
  }

  moveStageDown(stageId: string): void {
    this._workflow.update(w => {
      const idx = w.stages.findIndex(s => s.id === stageId);
      if (idx < 0 || idx >= w.stages.length - 1) return w;
      const stages = [...w.stages];
      [stages[idx], stages[idx + 1]] = [stages[idx + 1], stages[idx]];
      return { ...w, stages, updatedAt: new Date() };
    });
    this.scheduleAutoSave();
  }

  reorderStages(previousIndex: number, currentIndex: number): void {
    this._workflow.update(w => {
      const stages = [...w.stages];
      const [moved] = stages.splice(previousIndex, 1);
      stages.splice(currentIndex, 0, moved);
      return { ...w, stages, updatedAt: new Date() };
    });
    this.scheduleAutoSave();
  }

  toggleStageCollapse(stageId: string): void {
    this.updateStage(stageId, {
      collapsed: !this._workflow().stages.find(s => s.id === stageId)?.collapsed,
    });
  }

  setStageType(stageId: string, type: StageType): void {
    this.updateStage(stageId, {
      type,
      collectorRole: type === 'data_collection' ? null : null,
      fields: type === 'data_collection' ? [] : [],
      approvers: type === 'approval' ? [] : [],
      approvalMode: type === 'approval' ? 'sequential' : 'sequential',
    });
  }

  setStageRole(stageId: string, role: WorkflowRole): void {
    this.updateStage(stageId, { collectorRole: role });
  }

  setApprovalMode(stageId: string, mode: ApprovalMode): void {
    this.updateStage(stageId, { approvalMode: mode });
  }

  addField(stageId: string): void {
    const stage = this._workflow().stages.find(s => s.id === stageId);
    if (!stage) return;
    this.updateStage(stageId, {
      fields: [...stage.fields, createEmptyField()],
    });
  }

  updateField(stageId: string, fieldId: string, updates: Partial<WorkflowField>): void {
    const stage = this._workflow().stages.find(s => s.id === stageId);
    if (!stage) return;
    this.updateStage(stageId, {
      fields: stage.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
    });
  }

  removeField(stageId: string, fieldId: string): void {
    const stage = this._workflow().stages.find(s => s.id === stageId);
    if (!stage) return;
    this.updateStage(stageId, {
      fields: stage.fields.filter(f => f.id !== fieldId),
    });
  }

  addApprover(stageId: string): void {
    const stage = this._workflow().stages.find(s => s.id === stageId);
    if (!stage) return;
    this.updateStage(stageId, {
      approvers: [...stage.approvers, createEmptyApprover(stage.approvers.length + 1)],
    });
  }

  updateApprover(stageId: string, approverId: string, updates: Partial<Approver>): void {
    const stage = this._workflow().stages.find(s => s.id === stageId);
    if (!stage) return;
    this.updateStage(stageId, {
      approvers: stage.approvers.map(a => a.id === approverId ? { ...a, ...updates } : a),
    });
  }

  removeApprover(stageId: string, approverId: string): void {
    const stage = this._workflow().stages.find(s => s.id === stageId);
    if (!stage) return;
    this.updateStage(stageId, {
      approvers: stage.approvers.filter(a => a.id !== approverId),
    });
  }

  saveWorkflow(): void {
    const workflow = this._workflow();
    localStorage.setItem(`workflow_${workflow.id}`, JSON.stringify(workflow));
  }

  loadWorkflow(id: string): void {
    const data = localStorage.getItem(`workflow_${id}`);
    if (data) {
      this._workflow.set(JSON.parse(data) as Workflow);
    }
  }

  private validateWorkflow(): boolean {
    return this.validationErrors().length === 0;
  }

  private scheduleAutoSave(): void {
    const existing = this._autoSaveTimer();
    if (existing) clearTimeout(existing);
    this._autoSaveTimer.set(
      setTimeout(() => this.saveWorkflow(), 2000)
    );
  }
}
