import { Component, input, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkflowStage, StageFlowState } from '../../models/workflow.model';
import { RequestService } from '../../services/request.service';

/**
 * Holder stage flow (matches flowchart):
 *  1. Admin enters holder name + email
 *  2. Admin clicks "Send Request to Holder"
 *  3. System shows "Waiting for Holder Submission"
 *  4. When holder submits → stage completes → go to next stage
 */
@Component({
  selector: 'app-holder-stage-form',
  imports: [FormsModule],
  template: `
    <div class="holder-flow">

      <!-- Step 1: Collecting holder info -->
      @if (flow().status === 'collecting_info') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot active"></div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <div class="step-header">
              <span class="material-icons-outlined step-icon">person_add</span>
              <h3>Add the Holder Name and Email</h3>
            </div>
            <p class="step-desc">Enter the holder's details to send them a data submission request.</p>

            <div class="form-card">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Holder Name *</label>
                  <input
                    class="form-input"
                    type="text"
                    placeholder="Enter holder's full name"
                    [(ngModel)]="holderName" />
                </div>
                <div class="form-group">
                  <label class="form-label">Holder Email *</label>
                  <input
                    class="form-input"
                    type="email"
                    placeholder="holder&#64;example.com"
                    [(ngModel)]="holderEmail" />
                </div>
              </div>

              @if (stage().fields.length > 0) {
                <div class="fields-preview">
                  <span class="fields-label">Fields the holder will fill:</span>
                  <div class="field-tags">
                    @for (field of stage().fields; track field.id) {
                      <span class="field-tag">
                        {{ field.name }}
                        @if (field.required) { <span class="req-star">*</span> }
                      </span>
                    }
                  </div>
                </div>
              }

              <button
                class="btn btn-primary send-btn"
                [disabled]="!holderName.trim() || !holderEmail.trim()"
                (click)="onSendRequest()">
                <span class="material-icons-outlined" style="font-size:16px;">send</span>
                Send Request to Holder
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Step 2: Request sent — Waiting -->
      @if (flow().status === 'request_sent') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot completed">
              <span class="material-icons-outlined" style="font-size:12px;">check</span>
            </div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <div class="step-header">
              <span class="material-icons-outlined step-icon done">check_circle</span>
              <h3>Request Sent</h3>
            </div>
            <div class="sent-info">
              <span class="material-icons-outlined" style="font-size:14px;">person</span>
              {{ flow().participantName }} ({{ flow().participantEmail }})
            </div>
          </div>
        </div>

        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot waiting">
              <span class="pulse-ring"></span>
            </div>
          </div>
          <div class="step-content">
            <div class="waiting-card">
              <div class="waiting-header">
                <span class="material-icons-outlined waiting-icon">hourglass_top</span>
                <div>
                  <h4>Waiting for Holder Submission</h4>
                  <p>The holder has been notified. Waiting for them to submit the required data.</p>
                </div>
              </div>
              <div class="waiting-actions">
                <button class="btn btn-outline btn-sm" (click)="onResendRequest()">
                  <span class="material-icons-outlined" style="font-size:14px;">refresh</span>
                  Resend Request
                </button>
                <button class="btn btn-success btn-sm" (click)="onSimulateSubmission()">
                  <span class="material-icons-outlined" style="font-size:14px;">fast_forward</span>
                  Simulate Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Step 3: Submitted → completed -->
      @if (flow().status === 'form_submitted' || flow().status === 'completed') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot completed">
              <span class="material-icons-outlined" style="font-size:12px;">check</span>
            </div>
          </div>
          <div class="step-content">
            <div class="complete-card">
              <span class="material-icons-outlined" style="font-size:20px; color: var(--color-success);">task_alt</span>
              <div>
                <h4>Holder Data Received</h4>
                <p>{{ flow().participantName }} submitted the required information.</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .holder-flow {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .flow-step {
      display: flex;
      gap: 16px;
      padding-bottom: 8px;
    }

    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 24px;
    }

    .step-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid var(--color-border);
      background: var(--color-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;

      &.active {
        border-color: var(--color-primary);
        background: var(--color-primary);
      }

      &.completed {
        border-color: var(--color-success);
        background: var(--color-success);
        color: white;
      }

      &.waiting {
        border-color: var(--color-warning);
        background: var(--color-warning);
      }
    }

    .pulse-ring {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .step-line {
      width: 2px;
      flex: 1;
      min-height: 20px;
      background: var(--color-border);
      margin-top: 4px;
    }

    .step-content {
      flex: 1;
      padding-bottom: 16px;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      h3 {
        font-size: 15px;
        font-weight: 600;
      }
    }

    .step-icon {
      font-size: 20px;
      color: var(--color-primary);

      &.done { color: var(--color-success); }
    }

    .step-desc {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-bottom: 14px;
    }

    .form-card {
      background: var(--color-bg);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .fields-preview {
      padding: 10px 14px;
      background: var(--color-primary-bg);
      border-radius: var(--radius-md);
    }

    .fields-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: block;
      margin-bottom: 6px;
    }

    .field-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .field-tag {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 10px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 100px;
      color: var(--color-text-secondary);
    }

    .req-star {
      color: var(--color-danger);
      margin-left: 1px;
    }

    .send-btn {
      align-self: flex-start;
    }

    .sent-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--color-text-secondary);
      padding: 4px 0;
    }

    .waiting-card {
      background: var(--color-warning-bg);
      border: 1px solid #fde68a;
      border-radius: var(--radius-lg);
      padding: 18px;
    }

    .waiting-header {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text);
      }

      p {
        font-size: 12px;
        color: var(--color-text-secondary);
        margin-top: 2px;
      }
    }

    .waiting-icon {
      font-size: 24px;
      color: var(--color-warning);
      animation: spin 3s linear infinite;
    }

    @keyframes spin { 100% { transform: rotate(360deg); } }

    .waiting-actions {
      display: flex;
      gap: 8px;
    }

    .complete-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      background: var(--color-success-bg);
      border: 1px solid #a7f3d0;
      border-radius: var(--radius-lg);

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text);
      }

      p {
        font-size: 12px;
        color: var(--color-text-secondary);
        margin-top: 1px;
      }
    }

    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
    }
  `,
})
export class HolderStageForm {
  readonly stage = input.required<WorkflowStage>();
  readonly flow = input.required<StageFlowState>();
  readonly requestId = input.required<string>();
  readonly stageCompleted = output<void>();

  protected holderName = '';
  protected holderEmail = '';

  private readonly requestService = inject(RequestService);

  protected onSendRequest(): void {
    this.requestService.sendExternalRequest(
      this.requestId(),
      this.stage().id,
      'holder',
      this.holderName.trim(),
      this.holderEmail.trim(),
    );
  }

  protected onResendRequest(): void {
    // Resend would re-trigger the notification in real implementation
  }

  protected onSimulateSubmission(): void {
    this.requestService.simulateExternalSubmission(this.requestId(), this.stage().id);
  }
}
