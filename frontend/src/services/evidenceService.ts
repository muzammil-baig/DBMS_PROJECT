import { apiClient } from './apiClient';
import { EvidenceCreate, EvidenceRead } from '../types';

export const evidenceService = {
  async addEvidence(relationshipId: string, payload: EvidenceCreate): Promise<EvidenceRead> {
    if (!relationshipId) {
      throw new Error('A relationship ID is required to attach evidence.');
    }
    const evidenceTypeCode = payload.evidence_type_code.trim();
    const description = payload.description.trim();
    const dataClassCode = payload.data_class_code.trim();

    if (!evidenceTypeCode) {
      throw new Error('Evidence type is required.');
    }
    if (!description) {
      throw new Error('Evidence description is required.');
    }
    if (!dataClassCode) {
      throw new Error('Data classification is required.');
    }

    const cleanPayload: EvidenceCreate = {
      evidence_type_code: evidenceTypeCode,
      description,
      source_reference: payload.source_reference?.trim() || null,
      source_url: payload.source_url?.trim() || null,
      data_class_code: dataClassCode,
    };

    const response = await apiClient.post<EvidenceRead>(
      `/relationships/${relationshipId}/evidence`,
      cleanPayload
    );
    return response.data;
  },
};

