import { apiClient } from './apiClient';
import { ImpactCreate, ImpactRead, ImpactUpdate } from '../types';

export const impactService = {
  async addImpact(eventId: string, payload: ImpactCreate): Promise<ImpactRead> {
    if (!eventId) {
      throw new Error('An event ID is required to record an impact.');
    }

    const impactTypeCode = payload.impact_type_code.trim();
    const unitCode = payload.unit_code.trim();
    const dataClassCode = payload.data_class_code.trim();

    if (!impactTypeCode) throw new Error('Impact type is required.');
    if (!unitCode) throw new Error('Measurement unit is required.');
    if (!dataClassCode) throw new Error('Data classification is required.');
    if (!Number.isFinite(payload.quantity) || payload.quantity < 0) {
      throw new Error('Quantity must be a valid non-negative number.');
    }
    if (payload.verification_status !== 'verified' && payload.verification_status !== 'estimated') {
      throw new Error('Verification status must be verified or estimated.');
    }

    const estimateBasis = payload.estimate_basis?.trim() || null;
    if (payload.verification_status === 'estimated' && !estimateBasis) {
      throw new Error('An estimate basis is mandatory when verification status is estimated.');
    }

    const affectedLocationId = payload.affected_location_id?.trim() || null;
    const affectedAssetId = payload.affected_asset_id?.trim() || null;
    const affectedServiceId = payload.affected_service_id?.trim() || null;
    const affectedActivityId = payload.affected_activity_id?.trim() || null;
    const affectedDepartmentId = payload.affected_department_id?.trim() || null;
    const affectedObjectDescription = payload.affected_object_description?.trim() || null;

    const structuredCount = [
      affectedLocationId,
      affectedAssetId,
      affectedServiceId,
      affectedActivityId,
      affectedDepartmentId,
    ].filter(Boolean).length;

    if (structuredCount > 1) {
      throw new Error('At most one structured affected-object ID may be provided.');
    }
    if (structuredCount === 0 && !affectedObjectDescription) {
      throw new Error('Provide one structured affected entity or an affected object description.');
    }

    const cleanPayload: ImpactCreate = {
      impact_type_code: impactTypeCode,
      affected_location_id: affectedLocationId,
      affected_asset_id: affectedAssetId,
      affected_service_id: affectedServiceId,
      affected_activity_id: affectedActivityId,
      affected_department_id: affectedDepartmentId,
      affected_object_description: affectedObjectDescription,
      quantity: payload.quantity,
      unit_code: unitCode,
      verification_status: payload.verification_status,
      estimate_basis: payload.verification_status === 'estimated' ? estimateBasis : null,
      data_class_code: dataClassCode,
    };

    const response = await apiClient.post<ImpactRead>(`/events/${eventId}/impacts`, cleanPayload);
    return response.data;
  },

  async listImpacts(eventId: string): Promise<ImpactRead[]> {
    const response = await apiClient.get<ImpactRead[]>(`/events/${eventId}/impacts`);
    return response.data;
  },

  async updateImpact(impactId: string, payload: ImpactUpdate): Promise<ImpactRead> {
    const response = await apiClient.patch<ImpactRead>(`/impacts/${impactId}`, payload);
    return response.data;
  },
};

