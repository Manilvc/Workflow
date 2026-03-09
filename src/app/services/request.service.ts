import { Injectable, signal, computed } from '@angular/core';
import {
  CredentialRequest,
  RequestStatus,
  Participant,
  ActivityEntry,
  Workflow,
  StageFlowState,
  StageFlowStatus,
  WorkflowRole,
  createStageFlowState,
} from '../models/workflow.model';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly _requests = signal<CredentialRequest[]>(this.loadMockRequests());
  private readonly _activeRequest = signal<CredentialRequest | null>(null);

  readonly requests = this._requests.asReadonly();
  readonly activeRequest = this._activeRequest.asReadonly();

  readonly activeStage = computed(() => {
    const req = this._activeRequest();
    if (!req) return null;
    return req.workflow.stages[req.currentStageIndex] ?? null;
  });

  readonly activeStageFlow = computed((): StageFlowState | null => {
    const req = this._activeRequest();
    const stage = this.activeStage();
    if (!req || !stage) return null;
    return req.stageFlows[stage.id] ?? createStageFlowState(stage.id);
  });

  readonly isAllStagesComplete = computed(() => {
    const req = this._activeRequest();
    if (!req) return false;
    return req.currentStageIndex >= req.workflow.stages.length;
  });

  createRequest(workflow: Workflow, subject: string, group: string): CredentialRequest {
    const stageFlows: Record<string, StageFlowState> = {};
    workflow.stages.forEach(stage => {
      const flow = createStageFlowState(stage.id);
      if (stage.type === 'data_collection' && stage.collectorRole === 'issuer') {
        flow.status = 'deciding_issuer';
      } else if (stage.type === 'data_collection') {
        flow.status = 'collecting_info';
      } else if (stage.type === 'approval') {
        flow.status = 'pending_approval';
      }
      stageFlows[stage.id] = flow;
    });

    const request: CredentialRequest = {
      id: `REQ-${Date.now().toString(36).toUpperCase()}`,
      subject,
      group,
      workflowName: workflow.name,
      workflow: structuredClone(workflow),
      currentStageIndex: 0,
      status: 'draft',
      participants: [],
      activity: [{
        timestamp: new Date(),
        message: 'Request created',
        type: 'info',
      }],
      createdAt: new Date(),
      assignedTo: '',
      data: {},
      stageFlows,
    };
    this._requests.update(list => [...list, request]);
    this._activeRequest.set(request);
    return request;
  }

  setActiveRequest(requestId: string): void {
    const req = this._requests().find(r => r.id === requestId);
    if (req) {
      // Ensure stageFlows exists for legacy mock data
      const stageFlows = req.stageFlows ?? {};
      req.workflow.stages.forEach(stage => {
        if (!stageFlows[stage.id]) {
          const flow = createStageFlowState(stage.id);
          if (stage.type === 'data_collection' && stage.collectorRole === 'issuer') {
            flow.status = 'deciding_issuer';
          } else if (stage.type === 'data_collection') {
            flow.status = 'collecting_info';
          } else if (stage.type === 'approval') {
            flow.status = 'pending_approval';
          }
          stageFlows[stage.id] = flow;
        }
      });
      this._activeRequest.set({ ...req, stageFlows });
    } else {
      this._activeRequest.set(null);
    }
  }

  clearActiveRequest(): void {
    this._activeRequest.set(null);
  }

  // -- Stage flow mutations --

  updateStageFlow(requestId: string, stageId: string, updates: Partial<StageFlowState>): void {
    this._requests.update(list =>
      list.map(r => {
        if (r.id !== requestId) return r;
        const currentFlow = r.stageFlows[stageId] ?? createStageFlowState(stageId);
        return {
          ...r,
          stageFlows: {
            ...r.stageFlows,
            [stageId]: { ...currentFlow, ...updates },
          },
        };
      })
    );
    this.syncActiveRequest(requestId);
  }

  /** Holder / Data Collector: admin enters name + email, then sends request */
  sendExternalRequest(
    requestId: string,
    stageId: string,
    role: WorkflowRole,
    name: string,
    email: string,
  ): void {
    this.updateStageFlow(requestId, stageId, {
      status: 'request_sent',
      participantName: name,
      participantEmail: email,
    });

    const roleLabel = role === 'holder' ? 'Holder' : role === 'data_collector' ? 'Data Collector' : 'Issuer';

    this.addParticipant(requestId, { role, name, email, status: 'invited' });
    this.addActivity(requestId, {
      timestamp: new Date(),
      message: `Request sent to ${roleLabel}: ${name} (${email})`,
      type: 'info',
    });

    const statusMap: Record<string, RequestStatus> = {
      holder: 'waiting_for_holder',
      issuer: 'waiting_for_issuer',
      data_collector: 'waiting_for_collector',
    };
    this.updateRequestStatus(requestId, statusMap[role] ?? 'pending');
  }

  /** Issuer decided "same as me" → show form directly */
  setIssuerSelf(requestId: string, stageId: string, isSelf: boolean): void {
    if (isSelf) {
      this.updateStageFlow(requestId, stageId, {
        status: 'filling_form_self',
        issuerIsSelf: true,
      });
      this.addActivity(requestId, {
        timestamp: new Date(),
        message: 'Issuer is the current user — filling form directly',
        type: 'info',
      });
    } else {
      this.updateStageFlow(requestId, stageId, {
        status: 'collecting_info',
        issuerIsSelf: false,
      });
      this.addActivity(requestId, {
        timestamp: new Date(),
        message: 'Different issuer selected — collecting issuer details',
        type: 'info',
      });
    }
  }

  /** Self-issuer submits data → go to next stage */
  submitSelfIssuerData(requestId: string, stageId: string, formData: Record<string, string>): void {
    this.updateStageFlow(requestId, stageId, {
      status: 'form_submitted',
      formData,
    });
    this.addActivity(requestId, {
      timestamp: new Date(),
      message: 'Issuer submitted data directly',
      type: 'success',
    });
    this.completeStage(requestId);
  }

  /** Simulate external participant submitting data */
  simulateExternalSubmission(requestId: string, stageId: string): void {
    this.updateStageFlow(requestId, stageId, { status: 'form_submitted' });
    this.updateParticipantStatus(requestId, stageId);
    this.addActivity(requestId, {
      timestamp: new Date(),
      message: 'External participant submitted data',
      type: 'success',
    });
    this.completeStage(requestId);
  }

  /** Approval: approve the stage */
  approveStage(requestId: string, stageId: string): void {
    this.updateStageFlow(requestId, stageId, { status: 'approved' });
    this.addActivity(requestId, {
      timestamp: new Date(),
      message: 'Stage approved',
      type: 'success',
    });
    this.completeStage(requestId);
  }

  /** Approval: reject the stage */
  rejectStage(requestId: string, stageId: string): void {
    this.updateStageFlow(requestId, stageId, { status: 'rejected' });
    this.updateRequestStatus(requestId, 'rejected');
    this.addActivity(requestId, {
      timestamp: new Date(),
      message: 'Stage rejected',
      type: 'error',
    });
  }

  // -- Core mutations --

  updateRequestStatus(requestId: string, status: RequestStatus): void {
    this._requests.update(list =>
      list.map(r => r.id === requestId ? { ...r, status } : r)
    );
    this.syncActiveRequest(requestId);
  }

  addParticipant(requestId: string, participant: Participant): void {
    this._requests.update(list =>
      list.map(r => r.id === requestId
        ? { ...r, participants: [...r.participants, participant] }
        : r
      )
    );
    this.syncActiveRequest(requestId);
  }

  addActivity(requestId: string, entry: ActivityEntry): void {
    this._requests.update(list =>
      list.map(r => r.id === requestId
        ? { ...r, activity: [...r.activity, entry] }
        : r
      )
    );
    this.syncActiveRequest(requestId);
  }

  completeStage(requestId: string): void {
    this._requests.update(list =>
      list.map(r => {
        if (r.id !== requestId) return r;

        const currentStage = r.workflow.stages[r.currentStageIndex];
        if (currentStage) {
          r = {
            ...r,
            stageFlows: {
              ...r.stageFlows,
              [currentStage.id]: {
                ...(r.stageFlows[currentStage.id] ?? createStageFlowState(currentStage.id)),
                status: 'completed',
              },
            },
          };
        }

        const nextIndex = r.currentStageIndex + 1;
        const isComplete = nextIndex >= r.workflow.stages.length;

        if (isComplete) {
          return { ...r, status: 'completed' as RequestStatus };
        }

        // Initialize next stage flow status
        const nextStage = r.workflow.stages[nextIndex];
        const nextFlow = r.stageFlows[nextStage.id] ?? createStageFlowState(nextStage.id);
        if (nextFlow.status === 'idle') {
          if (nextStage.type === 'data_collection' && nextStage.collectorRole === 'issuer') {
            nextFlow.status = 'deciding_issuer';
          } else if (nextStage.type === 'data_collection') {
            nextFlow.status = 'collecting_info';
          } else if (nextStage.type === 'approval') {
            nextFlow.status = 'pending_approval';
          }
        }

        return {
          ...r,
          currentStageIndex: nextIndex,
          status: 'pending' as RequestStatus,
          stageFlows: { ...r.stageFlows, [nextStage.id]: nextFlow },
        };
      })
    );
    this.addActivity(requestId, {
      timestamp: new Date(),
      message: `Stage ${this._activeRequest()?.currentStageIndex ?? '?'} completed — moving to next stage`,
      type: 'success',
    });
    this.syncActiveRequest(requestId);
  }

  private updateParticipantStatus(requestId: string, stageId: string): void {
    this._requests.update(list =>
      list.map(r => {
        if (r.id !== requestId) return r;
        const flow = r.stageFlows[stageId];
        if (!flow) return r;
        return {
          ...r,
          participants: r.participants.map(p =>
            p.email === flow.participantEmail ? { ...p, status: 'submitted' as const } : p
          ),
        };
      })
    );
  }

  private syncActiveRequest(requestId: string): void {
    const active = this._activeRequest();
    if (active?.id === requestId) {
      const updated = this._requests().find(r => r.id === requestId);
      if (updated) this._activeRequest.set({ ...updated });
    }
  }

  private loadMockRequests(): CredentialRequest[] {
    return [
      {
        id: 'REQ-A1B2C3',
        subject: 'Business License – Retail Shop',
        group: 'Retail Businesses',
        workflowName: 'Retail License Workflow',
        workflow: {
          id: 'wf-1',
          name: 'Retail License Workflow',
          description: 'Standard retail business license issuance workflow',
          stages: [
            {
              id: 's1', name: 'Applicant Data Submission', type: 'data_collection',
              description: 'Collect applicant information', collectorRole: 'holder',
              fields: [
                { id: 'f1', name: 'Full Name', inputType: 'text', required: true, validation: '', helperText: '', options: [] },
                { id: 'f2', name: 'Email', inputType: 'email', required: true, validation: '', helperText: '', options: [] },
                { id: 'f3', name: 'License Number', inputType: 'text', required: true, validation: '', helperText: '', options: [] },
              ],
              approvalMode: 'sequential', approvers: [], collapsed: false,
            },
            {
              id: 's2', name: 'Tax Compliance Verification', type: 'approval',
              description: 'Verify tax compliance', collectorRole: null, fields: [],
              approvalMode: 'sequential',
              approvers: [
                { id: 'a1', role: 'Compliance Officer', order: 1, required: true },
                { id: 'a2', role: 'Department Head', order: 2, required: false },
              ],
              collapsed: false,
            },
            {
              id: 's3', name: 'Issuer Verification', type: 'data_collection',
              description: 'Issuer provides final verification data', collectorRole: 'issuer',
              fields: [
                { id: 'f4', name: 'Registration Date', inputType: 'date', required: true, validation: '', helperText: '', options: [] },
                { id: 'f5', name: 'Issuing Authority', inputType: 'text', required: true, validation: '', helperText: '', options: [] },
              ],
              approvalMode: 'sequential', approvers: [], collapsed: false,
            },
          ],
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-03-01'),
        },
        currentStageIndex: 0,
        status: 'draft',
        participants: [],
        activity: [
          { timestamp: new Date('2026-03-01T10:00:00'), message: 'Request created', type: 'info' },
        ],
        createdAt: new Date('2026-03-01'),
        assignedTo: '',
        data: {},
        stageFlows: {
          s1: { stageId: 's1', status: 'collecting_info', participantName: '', participantEmail: '', issuerIsSelf: null, formData: {} },
          s2: { stageId: 's2', status: 'pending_approval', participantName: '', participantEmail: '', issuerIsSelf: null, formData: {} },
          s3: { stageId: 's3', status: 'deciding_issuer', participantName: '', participantEmail: '', issuerIsSelf: null, formData: {} },
        },
      },
      {
        id: 'REQ-D4E5F6',
        subject: 'Professional Certificate – Engineering',
        group: 'Professional Certifications',
        workflowName: 'Professional Cert Workflow',
        workflow: {
          id: 'wf-2', name: 'Professional Cert Workflow',
          description: 'Multi-stage credential with holder, issuer, and collector stages',
          stages: [
            {
              id: 'ps1', name: 'Holder Information', type: 'data_collection',
              description: 'Collect holder personal info', collectorRole: 'holder',
              fields: [
                { id: 'pf1', name: 'Full Name', inputType: 'text', required: true, validation: '', helperText: '', options: [] },
                { id: 'pf2', name: 'Email', inputType: 'email', required: true, validation: '', helperText: '', options: [] },
              ],
              approvalMode: 'sequential', approvers: [], collapsed: false,
            },
            {
              id: 'ps2', name: 'Issuer Verification', type: 'data_collection',
              description: 'Issuer verifies and provides certification details', collectorRole: 'issuer',
              fields: [
                { id: 'pf3', name: 'Certificate Number', inputType: 'text', required: true, validation: '', helperText: '', options: [] },
                { id: 'pf4', name: 'Issue Date', inputType: 'date', required: true, validation: '', helperText: '', options: [] },
              ],
              approvalMode: 'sequential', approvers: [], collapsed: false,
            },
            {
              id: 'ps3', name: 'Third-Party Data', type: 'data_collection',
              description: 'Data collector gathers supporting documents', collectorRole: 'data_collector',
              fields: [
                { id: 'pf5', name: 'Supporting Document', inputType: 'file', required: true, validation: '', helperText: '', options: [] },
              ],
              approvalMode: 'sequential', approvers: [], collapsed: false,
            },
            {
              id: 'ps4', name: 'Final Approval', type: 'approval',
              description: 'Final sign-off', collectorRole: null, fields: [],
              approvalMode: 'sequential',
              approvers: [{ id: 'pa1', role: 'Department Head', order: 1, required: true }],
              collapsed: false,
            },
          ],
          createdAt: new Date(), updatedAt: new Date(),
        },
        currentStageIndex: 0,
        status: 'draft',
        participants: [],
        activity: [
          { timestamp: new Date('2026-03-05T09:00:00'), message: 'Request created', type: 'info' },
        ],
        createdAt: new Date('2026-03-05'),
        assignedTo: '',
        data: {},
        stageFlows: {
          ps1: { stageId: 'ps1', status: 'collecting_info', participantName: '', participantEmail: '', issuerIsSelf: null, formData: {} },
          ps2: { stageId: 'ps2', status: 'deciding_issuer', participantName: '', participantEmail: '', issuerIsSelf: null, formData: {} },
          ps3: { stageId: 'ps3', status: 'collecting_info', participantName: '', participantEmail: '', issuerIsSelf: null, formData: {} },
          ps4: { stageId: 'ps4', status: 'pending_approval', participantName: '', participantEmail: '', issuerIsSelf: null, formData: {} },
        },
      },
    ];
  }
}
