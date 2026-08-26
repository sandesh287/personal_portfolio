import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import { compactParams } from "@/utils/apiParams";

import type {
  GroupedSkills,
  Skill,
  SkillListParams,
  SkillListResponse,
  SkillMutationPayload,
} from "./types";

const ENDPOINT = "/skills";

export const skillApi = {
  list(params?: SkillListParams) {
    return getApiData<SkillListResponse>(ENDPOINT, { params: compactParams(params) });
  },
  grouped() {
    return getApiData<GroupedSkills>(`${ENDPOINT}/grouped`);
  },
  async create(payload: SkillMutationPayload) {
    const response = await httpClient.post<ApiResponse<Skill>>(ENDPOINT, payload);
    return response.data.data;
  },
  async update(id: string, payload: Partial<SkillMutationPayload>) {
    const response = await httpClient.patch<ApiResponse<Skill>>(`${ENDPOINT}/${id}`, payload);
    return response.data.data;
  },
  async remove(id: string) {
    await httpClient.delete(`${ENDPOINT}/${id}`);
  },
};
