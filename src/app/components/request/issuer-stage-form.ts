import { Component, input, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkflowStage, StageFlowState } from '../../models/workflow.model';
import { RequestService } from '../../services/request.service';

/**
 * Issuer stage flow (matches flowchart exactly):
 *  1. "Is the issuer the same as logged-in user?" → Yes / No
 *
 *  YES path:
 *    → Fill required fields form → Submit → Go to next stage
 *
 *  NO path:
 *    → Enter issuer name + email → Send request
 *    → "Waiting for Issuer Response"
 *    → After issuer submits → Go to next stage
 */
@Component({
  selector: 'app-issuer-stage-form',
  imports: [FormsModule],
  template: `
    <div class="issuer-flow">

      <!-- Decision: "If Issuer Same?" -->
      @if (flow().status === 'deciding_issuer') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot decision">
              <span class="material-icons-outlined" style="font-size:14px; color:white;">help</span>
            </div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <div class="decision-card">
              <div class="decision-header">
                <span class="material-icons-outlined" style="font-size:22px; color: var(--color-purple);">diamond</span>
                <div>
                  <h3>Is the Issuer the same as the logged-in user?</h3>
                  <p>This determines whether you fill the form directly or invite an external issuer.</p>
                </div>
              </div>

              <div class="decision-paths">
                <!-- YES path -->
                <button class="path-card yes-path" (click)="onDecideIssuer(true)">
                  <div class="path-indicator yes">
                    <span class="material-icons-outlined" style="font-size:20px;">check_circle</span>
                  </div>
                  <div class="path-info">
                    <span class="path-title">Yes, I am the Issuer</span>
                    <span class="path-desc">Fill the required details directly</span>
                  </div>
                  <span class="material-icons-outlined path-arrow">arrow_forward</span>
                </button>

                <!-- NO path -->
                <button class="path-card no-path" (click)="onDecideIssuer(false)">
                  <div class="path-indicator no">
                    <span class="material-icons-outlined" style="font-size:20px;">person_add</span>
                  </div>
                  <div class="path-info">
                    <span class="path-title">No, invite another Issuer</span>
                    <span class="path-desc">Enter issuer name and email to send the request</span>
                  </div>
                  <span class="material-icons-outlined path-arrow">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- YES Path: Fill form directly -->
      @if (flow().status === 'filling_form_self') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot completed">
              <span class="material-icons-outlined" style="font-size:12px;">check</span>
            </div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <div class="step-header muted">
              <span class="material-icons-outlined" style="font-size:16px; color: var(--color-success);">check_circle</span>
              <span>Issuer is the current user</span>
            </div>
          </div>
        </div>

        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot active"></div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <div class="step-header">
              <span class="material-icons-outlined step-icon">edit_note</span>
              <h3>Fill the Required Details</h3>
            </div>
            <p class="step-desc">Complete the fields below as the Issuer.</p>

            <div class="form-card">
              @for (field of stage().fields; track field.id) {
                <div class="form-group">
                  <label class="form-label">{{ field.name }} {{ field.required ? '*' : '' }}</label>
                  @switch (field.inputType) {
                    @case ('text') {
                      <input class="form-input" type="text" [placeholder]="'Enter ' + field.name"
                        [(ngModel)]="formData[field.id]" />
                    }
                    @case ('email') {
                      <input class="form-input" type="email" [placeholder]="'Enter ' + field.name"
                        [(ngModel)]="formData[field.id]" />
                    }
                    @case ('date') {
                      <input class="form-input" type="date"
                        [(ngModel)]="formData[field.id]" />
                    }
                    @case ('number') {
                      <input class="form-input" type="number" [placeholder]="'Enter ' + field.name"
                        [(ngModel)]="formData[field.id]" />
                    }
                    @case ('file') {
                      <input class="form-input" type="file" />
                    }
                    @default {
                      <input class="form-input" type="text" [placeholder]="'Enter ' + field.name"
                        [(ngModel)]="formData[field.id]" />
                    }
                  }
                </div>
              }
              <button class="btn btn-primary" (click)="onSubmitSelfData()">
                <span class="material-icons-outlined" style="font-size:16px;">check</span>
                Submit Data &amp; Go to Next Stage
              </button>
            </div>
          </div>
        </div>
      }

      <!-- NO Path: Collect issuer info -->
      @if (flow().status === 'collecting_info') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot completed">
              <span class="material-icons-outlined" style="font-size:12px;">check</span>
            </div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <div class="step-header muted">
              <span class="material-icons-outlined" style="font-size:16px; color: var(--color-primary);">info</span>
              <span>Different issuer selected</span>
            </div>
          </div>
        </div>

        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot active"></div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <div class="step-header">
              <span class="material-icons-outlined step-icon">person_add</span>
              <h3>Enter Issuer Name and Email</h3>
            </div>
            <p class="step-desc">Provide the issuer's details to send them the request.</p>

            <div class="form-card">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Issuer Name *</label>
                  <input class="form-input" type="text" placeholder="Enter issuer's full name"
                    [(ngModel)]="issuerName" />
                </div>
                <div class="form-group">
                  <label class="form-label">Issuer Email *</label>
                  <input class="form-input" type="email" placeholder="issuer&#64;organization.com"
                    [(ngModel)]="issuerEmail" />
                </div>
              </div>

              @if (stage().fields.length > 0) {
                <div class="fields-preview">
                  <span class="fields-label">Fields the issuer will fill:</span>
                  <div class="field-tags">
                    @for (field of stage().fields; track field.id) {
                      <span class="field-tag">{{ field.name }}</span>
                    }
                  </div>
                </div>
              }

              <button class="btn btn-primary"
                [disabled]="!issuerName.trim() || !issuerEmail.trim()"
                (click)="onSendToIssuer()">
                <span class="material-icons-outlined" style="font-size:16px;">send</span>
                Submit the Request
              </button>
            </div>
          </div>
        </div>
      }

      <!-- NO Path: Request sent — Waiting -->
      @if (flow().status === 'request_sent') {
        <div class="flow-step">
          <div class="step-indicator">
            <div class="step-dot completed">
              <span class="material-icons-outlined" style="font-size:12px;">check</span>
            </div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <div class="step-header muted">
              <span class="material-icons-outlined" style="font-size:16px; color: var(--color-success);">check_circle</span>
              <span>Request sent to {{ flow().participantName }} ({{ flow().participantEmail }})</span>
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
                  <h4>Waiting for Issuer Response</h4>
                  <p>After the issuer submits the data, the request will move to the next stage.</p>
                </div>
              </div>
              <div class="waiting-actions">
                <button class="btn btn-outline btn-sm" (click)="onResend()">
                  <span class="material-icons-outlined" style="font-size:14px;">refresh</span>
                  Resend
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

      <!-- Completed state -->
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
                <h4>Issuer Data Received</h4>
                <p>Data has been submitted successfully. Moving to next stage.</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .issuer-flow {
      display: flex;
      flex-direction: column;
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
      z-index: 1;

      &.active { border-color: var(--color-primary); background: var(--color-primary); }
      &.completed { border-color: var(--color-success); background: var(--color-success); color: white; }
      &.waiting { border-color: var(--color-warning); background: var(--color-warning); }
      &.decision { border-color: var(--color-purple); background: var(--color-purple); }
    }

    .pulse-ring {
      width: 8px; height: 8px; border-radius: 50%; background: white;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .step-line {
      width: 2px; flex: 1; min-height: 20px;
      background: var(--color-border); margin-top: 4px;
    }

    .step-content { flex: 1; padding-bottom: 16px; }

    .step-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
      h3 { font-size: 15px; font-weight: 600; }

      &.muted {
        font-size: 12px; color: var(--color-text-muted); font-weight: 500;
      }
    }

    .step-icon { font-size: 20px; color: var(--color-primary); }
    .step-desc { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 14px; }

    // Decision card
    .decision-card {
      background: var(--color-purple-bg);
      border: 1px solid #ddd6fe;
      border-radius: var(--radius-lg);
      padding: 20px;
    }

    .decision-header {
      display: flex; gap: 12px; margin-bottom: 18px;
      h3 { font-size: 15px; font-weight: 600; }
      p { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
    }

    .decision-paths { display: flex; flex-direction: column; gap: 10px; }

    .path-card {
      display: flex; align-items: center; gap: 14px;
      padding: 16px; background: var(--color-surface);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      text-align: left; cursor: pointer;
      transition: all 200ms ease;

      &:hover { border-color: var(--color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    }

    .path-indicator {
      width: 40px; height: 40px; min-width: 40px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;

      &.yes { background: var(--color-success-bg); color: var(--color-success); }
      &.no { background: var(--color-primary-bg); color: var(--color-primary); }
    }

    .path-info { flex: 1; }
    .path-title { font-size: 14px; font-weight: 600; display: block; color: var(--color-text); }
    .path-desc { font-size: 12px; color: var(--color-text-muted); }
    .path-arrow { color: var(--color-text-muted); font-size: 20px; }

    // Form
    .form-card {
      background: var(--color-bg); border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg); padding: 18px;
      display: flex; flex-direction: column; gap: 14px;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }

    .fields-preview {
      padding: 10px 14px; background: var(--color-primary-bg); border-radius: var(--radius-md);
    }

    .fields-label {
      font-size: 11px; font-weight: 600; color: var(--color-text-secondary);
      text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 6px;
    }

    .field-tags { display: flex; flex-wrap: wrap; gap: 6px; }

    .field-tag {
      font-size: 12px; font-weight: 500; padding: 2px 10px;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: 100px; color: var(--color-text-secondary);
    }

    .waiting-card {
      background: var(--color-warning-bg); border: 1px solid #fde68a;
      border-radius: var(--radius-lg); padding: 18px;
    }

    .waiting-header {
      display: flex; gap: 12px; margin-bottom: 12px;
      h4 { font-size: 14px; font-weight: 600; }
      p { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
    }

    .waiting-icon {
      font-size: 24px; color: var(--color-warning);
      animation: spin 3s linear infinite;
    }

    @keyframes spin { 100% { transform: rotate(360deg); } }
    .waiting-actions { display: flex; gap: 8px; }

    .complete-card {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 18px; background: var(--color-success-bg);
      border: 1px solid #a7f3d0; border-radius: var(--radius-lg);
      h4 { font-size: 14px; font-weight: 600; }
      p { font-size: 12px; color: var(--color-text-secondary); margin-top: 1px; }
    }

    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
      .decision-paths { gap: 8px; }
    }
  `,
})
export class IssuerStageForm {
  readonly stage = input.required<WorkflowStage>();
  readonly flow = input.required<StageFlowState>();
  readonly requestId = input.required<string>();
  readonly stageCompleted = output<void>();

  protected issuerName = '';
  protected issuerEmail = '';
  protected formData: Record<string, string> = {};

  private readonly requestService = inject(RequestService);

  protected onDecideIssuer(isSelf: boolean): void {
    this.requestService.setIssuerSelf(this.requestId(), this.stage().id, isSelf);
  }

  protected onSubmitSelfData(): void {
    this.requestService.submitSelfIssuerData(this.requestId(), this.stage().id, this.formData);
  }

  protected onSendToIssuer(): void {
    this.requestService.sendExternalRequest(
      this.requestId(),
      this.stage().id,
      'issuer',
      this.issuerName.trim(),
      this.issuerEmail.trim(),
    );
  }

  protected onResend(): void {
    // placeholder — re-trigger notification
  }

  protected onSimulateSubmission(): void {
    this.requestService.simulateExternalSubmission(this.requestId(), this.stage().id);
  }
}
