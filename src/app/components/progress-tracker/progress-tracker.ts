import { Component, input } from '@angular/core';
import { WorkflowStage } from '../../models/workflow.model';

@Component({
  selector: 'app-progress-tracker',
  template: `
    <div class="tracker">
      <!-- Request Created -->
      <div class="step completed">
        <div class="step-dot">
          <span class="material-icons-outlined" style="font-size:12px;">check</span>
        </div>
        <span class="step-label">Request Created</span>
      </div>
      <div class="step-line completed"></div>

      @for (stage of stages(); track stage.id; let i = $index) {
        <div class="step"
          [class.completed]="i < currentIndex()"
          [class.active]="i === currentIndex()"
          [class.pending]="i > currentIndex()">
          <div class="step-dot">
            @if (i < currentIndex()) {
              <span class="material-icons-outlined" style="font-size:12px;">check</span>
            } @else if (i === currentIndex()) {
              <span class="dot-pulse"></span>
            }
          </div>
          <span class="step-label">{{ stage.name || 'Stage ' + (i + 1) }}</span>
        </div>
        @if (i < stages().length - 1 || true) {
          <div class="step-line"
            [class.completed]="i < currentIndex()"
            [class.active]="i === currentIndex()">
          </div>
        }
      }

      <!-- Credential Issued -->
      <div class="step" [class.completed]="isComplete()">
        <div class="step-dot">
          @if (isComplete()) {
            <span class="material-icons-outlined" style="font-size:12px;">check</span>
          }
        </div>
        <span class="step-label">Credential Issued</span>
      </div>
    </div>
  `,
  styles: `
    .tracker {
      display: flex;
      align-items: center;
      padding: 16px 24px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      overflow-x: auto;
      gap: 0;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .step-dot {
      width: 22px;
      height: 22px;
      min-width: 22px;
      border-radius: 50%;
      border: 2px solid var(--color-border);
      background: var(--color-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all var(--transition-normal);
    }

    .step-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-muted);
      transition: color var(--transition-normal);
    }

    .step.completed .step-dot {
      background: var(--color-success);
      border-color: var(--color-success);
    }

    .step.completed .step-label {
      color: var(--color-success);
      font-weight: 600;
    }

    .step.active .step-dot {
      background: var(--color-primary);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px var(--color-primary-bg);
    }

    .step.active .step-label {
      color: var(--color-primary);
      font-weight: 600;
    }

    .step.pending .step-dot {
      background: var(--color-bg);
    }

    .step-line {
      width: 32px;
      min-width: 32px;
      height: 2px;
      background: var(--color-border);
      margin: 0 4px;
      transition: background var(--transition-normal);

      &.completed { background: var(--color-success); }
      &.active { background: linear-gradient(to right, var(--color-primary), var(--color-border)); }
    }

    .dot-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: white;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `,
})
export class ProgressTracker {
  readonly stages = input.required<WorkflowStage[]>();
  readonly currentIndex = input.required<number>();

  protected isComplete(): boolean {
    return this.currentIndex() >= this.stages().length;
  }
}
