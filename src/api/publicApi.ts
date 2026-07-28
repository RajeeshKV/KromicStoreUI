import apiClient from './apiClient';

export interface TenantResolutionResponse {
  tenantId: string;
  name: string;
  subdomain: string;
}

/**
 * Resolves tenant by subdomain
 * @param subdomain - The subdomain to resolve
 * @returns Tenant information
 */
export async function resolveTenantBySubdomain(subdomain: string): Promise<TenantResolutionResponse> {
  const response = await apiClient.get('/api/v1/public/tenant/by-subdomain', {
    params: { subdomain }
  });
  return response.data.data;
}
