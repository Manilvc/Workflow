import { Component, inject } from '@angular/core';
import { WorkflowService } from '../../services/workflow.service';
import { SidebarNav } from '../../components/sidebar-nav/sidebar-nav';
import { WorkflowInfo } from '../../components/workflow-info/workflow-info';
import { StageBuilder } from '../../components/stage-builder/stage-builder';
import { WorkflowPreview } from '../../components/workflow-preview/workflow-preview';

@Component({
  selector: 'app-workflow-builder',
  imports: [SidebarNav, WorkflowInfo, StageBuilder, WorkflowPreview],
  template: `
    <div class="builder-layout">
      <!-- Left Sidebar -->
      <app-sidebar-nav
        [activeSection]="workflowService.activeSection()"
        (sectionChange)="workflowService.setActiveSection($event)" />

      <!-- Center Panel -->
      <div class="center-panel">
        <div class="panel-header">
          <h1>Workflow Builder</h1>
          <p>Design multi-stage credential issuance workflows</p>
        </div>

        <div class="panel-content">
          <!-- Workflow Info -->
          <app-workflow-info />

          <!-- Stage Builder -->
          <app-stage-builder />
        </div>
      </div>

      <!-- Right Panel - Preview -->
      <app-workflow-preview [stages]="workflowService.stages()" />
    </div>
  `,
  styles: `
    .builder-layout {
      display: flex;
      height: calc(100vh - 56px);
      overflow: hidden;
    }

    .center-panel {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      background: var(--color-bg);
    }

    .panel-header {
      margin-bottom: 24px;

      h1 {
        font-size: 22px;
        font-weight: 700;
        color: var(--color-text);
        margin-bottom: 4px;
      }

      p {
        font-size: 13px;
        color: var(--color-text-muted);
      }
    }

    .panel-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 720px;
    }

    @media (max-width: 1024px) {
      .builder-layout {
        flex-direction: column;
        height: auto;
      }

      :host ::ng-deep app-sidebar-nav .sidebar {
        width: 100%;
        min-width: unset;
        flex-direction: row;
        border-right: none;
        border-bottom: 1px solid var(--color-border);
        height: auto;

        .sidebar-header { display: none; }
        .sidebar-footer { display: none; }
        .sidebar-nav {
          flex-direction: row;
          padding: 8px;
        }
      }

      :host ::ng-deep app-workflow-preview .preview-panel {
        width: 100%;
        min-width: unset;
        border-left: none;
        border-top: 1px solid var(--color-border);
        max-height: 300px;
      }
    }

    @media (max-width: 768px) {
      .center-panel {
        padding: 16px;
      }
    }
  `,
})
export class WorkflowBuilder {
  protected readonly workflowService = inject(WorkflowService);
}
