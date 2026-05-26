// ============================================================
// landa-groups.ts — LANDA Groups API
// Endpoints: /api/landa/admin/groups/* + /api/landa/v0/my-group-courses/
// Auth: Bearer token qua apiClient (giống landa-admin.ts)
// ============================================================

import { apiClient } from './client';

const BASE = '/api/landa';

// ── Types ──

export interface OrgGroup {
  id: number;
  name: string;
  description: string;
  subgroup_count: number;
  created_at: string;
}

export interface SubGroup {
  id: number;
  name: string;
  org_group_id: number;
  team_count: number;
  created_at: string;
}

export interface SubGroupMember {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  added_at: string;
}

export interface AssignedCourse {
  course_id: string;
  display_name: string;
  assigned_at: string;
}

export interface AssignedCategory {
  category_id: number;
  name: string;
  assigned_at: string;
}

export interface AssignedCourseCategory {
  category_id: number;
  name: string;
  slug: string;
  assigned_at: string;
}

export interface SubGroupDetail {
  id: number;
  name: string;
  org_group_id: number;
  org_group_name: string;
  team_count: number;
  teams: Team[];
  created_at: string;
  // Legacy direct-assignment fields (still returned by backend)
  member_count?: number;
  course_count?: number;
  category_count?: number;
  course_category_count?: number;
  members: SubGroupMember[];
  courses: AssignedCourse[];
  categories: AssignedCategory[];
  course_categories: AssignedCourseCategory[];
}

export interface Team {
  id: number;
  name: string;
  subgroup_id: number;
  member_count: number;
  course_count: number;
  course_category_count: number;
  created_at: string;
}

export interface TeamDetail extends Team {
  subgroup_name: string;
  org_group_id: number;
  org_group_name: string;
  category_count: number;
  members: SubGroupMember[];
  courses: AssignedCourse[];
  categories: AssignedCategory[];
  course_categories: AssignedCourseCategory[];
}

export interface GroupAuditLogItem {
  id: number;
  actor_username: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  detail: string;
  ip_address: string;
  created_at: string;
}

interface GroupListResponse {
  groups: OrgGroup[];
  total: number;
  page: number;
  page_size: number;
}

interface SubGroupListResponse {
  subgroups: SubGroup[];
  total: number;
}

interface TeamListResponse {
  teams: Team[];
  total: number;
}

// ── Org Group API ──

export async function getOrgGroups(params?: {
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<GroupListResponse> {
  const { data } = await apiClient.get(`${BASE}/admin/groups/`, { params });
  return data;
}

export async function createOrgGroup(payload: {
  name: string;
  description?: string;
}): Promise<{ id: number; name: string }> {
  const { data } = await apiClient.post(`${BASE}/admin/groups/`, payload);
  return data;
}

export async function updateOrgGroup(
  id: number,
  payload: { name?: string; description?: string },
): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch(`${BASE}/admin/groups/${id}/`, payload);
  return data;
}

export async function deleteOrgGroup(id: number): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/groups/${id}/`);
  return data;
}

// ── Sub Group API ──

export async function getSubGroups(
  groupId: number,
  params?: { search?: string },
): Promise<SubGroupListResponse> {
  const { data } = await apiClient.get(`${BASE}/admin/groups/${groupId}/subgroups/`, { params });
  return data;
}

export async function createSubGroup(
  groupId: number,
  payload: { name: string },
): Promise<{ id: number; name: string }> {
  const { data } = await apiClient.post(`${BASE}/admin/groups/${groupId}/subgroups/`, payload);
  return data;
}

export async function getSubGroupDetail(id: number): Promise<SubGroupDetail> {
  const { data } = await apiClient.get(`${BASE}/admin/subgroups/${id}/`);
  return data;
}

export async function updateSubGroup(
  id: number,
  payload: { name: string },
): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch(`${BASE}/admin/subgroups/${id}/`, payload);
  return data;
}

export async function deleteSubGroup(id: number): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/subgroups/${id}/`);
  return data;
}

// ── Team API ──

export async function getTeams(
  subgroupId: number,
  params?: { search?: string },
): Promise<TeamListResponse> {
  const { data } = await apiClient.get(`${BASE}/admin/subgroups/${subgroupId}/teams/`, { params });
  return data;
}

export async function createTeam(
  subgroupId: number,
  payload: { name: string },
): Promise<{ id: number; name: string }> {
  const { data } = await apiClient.post(`${BASE}/admin/subgroups/${subgroupId}/teams/`, payload);
  return data;
}

export async function getTeamDetail(id: number): Promise<TeamDetail> {
  const { data } = await apiClient.get(`${BASE}/admin/teams/${id}/`);
  return data;
}

export async function updateTeam(
  id: number,
  payload: { name: string },
): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch(`${BASE}/admin/teams/${id}/`, payload);
  return data;
}

export async function deleteTeam(id: number): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/teams/${id}/`);
  return data;
}

// ── Team Members API ──

export async function addTeamMembers(
  teamId: number,
  userIds: number[],
): Promise<{ success: boolean; added: number; skipped: number }> {
  const { data } = await apiClient.post(`${BASE}/admin/teams/${teamId}/members/`, { user_ids: userIds });
  return data;
}

export async function removeTeamMember(
  teamId: number,
  userId: number,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/teams/${teamId}/members/${userId}/`);
  return data;
}

// ── Team Course Assignment API ──

export async function assignTeamCourses(
  teamId: number,
  courseIds: string[],
): Promise<{ success: boolean; assigned: number; skipped: number }> {
  const { data } = await apiClient.post(`${BASE}/admin/teams/${teamId}/courses/`, { course_ids: courseIds });
  return data;
}

export async function revokeTeamCourse(
  teamId: number,
  courseId: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/teams/${teamId}/courses/${encodeURIComponent(courseId)}/`);
  return data;
}

// ── Team Category Assignment API ──

export async function assignTeamCategories(
  teamId: number,
  categoryIds: number[],
): Promise<{ success: boolean; assigned: number; skipped: number }> {
  const { data } = await apiClient.post(`${BASE}/admin/teams/${teamId}/categories/`, { category_ids: categoryIds });
  return data;
}

export async function revokeTeamCategory(
  teamId: number,
  categoryId: number,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/teams/${teamId}/categories/${categoryId}/`);
  return data;
}

// ── Team Course Category Assignment API ──

export async function assignTeamCourseCategories(
  teamId: number,
  categoryIds: number[],
): Promise<{ success: boolean; assigned: number; skipped: number }> {
  const { data } = await apiClient.post(`${BASE}/admin/teams/${teamId}/course-categories/`, { category_ids: categoryIds });
  return data;
}

export async function revokeTeamCourseCategory(
  teamId: number,
  categoryId: number,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/teams/${teamId}/course-categories/${categoryId}/`);
  return data;
}

// ── Legacy SubGroup Members API (kept for migration period) ──

export async function addMembers(
  sgId: number,
  userIds: number[],
): Promise<{ success: boolean; added: number; skipped: number }> {
  const { data } = await apiClient.post(`${BASE}/admin/subgroups/${sgId}/members/`, { user_ids: userIds });
  return data;
}

export async function removeMember(
  sgId: number,
  userId: number,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/subgroups/${sgId}/members/${userId}/`);
  return data;
}

export async function assignCourses(
  sgId: number,
  courseIds: string[],
): Promise<{ success: boolean; assigned: number; skipped: number }> {
  const { data } = await apiClient.post(`${BASE}/admin/subgroups/${sgId}/courses/`, { course_ids: courseIds });
  return data;
}

export async function revokeCourse(
  sgId: number,
  courseId: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/subgroups/${sgId}/courses/${encodeURIComponent(courseId)}/`);
  return data;
}

export async function assignCategories(
  sgId: number,
  categoryIds: number[],
): Promise<{ success: boolean; assigned: number; skipped: number }> {
  const { data } = await apiClient.post(`${BASE}/admin/subgroups/${sgId}/categories/`, { category_ids: categoryIds });
  return data;
}

export async function revokeCategory(
  sgId: number,
  categoryId: number,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/subgroups/${sgId}/categories/${categoryId}/`);
  return data;
}

export async function assignCourseCategories(
  sgId: number,
  categoryIds: number[],
): Promise<{ success: boolean; assigned: number; skipped: number }> {
  const { data } = await apiClient.post(`${BASE}/admin/subgroups/${sgId}/course-categories/`, { category_ids: categoryIds });
  return data;
}

export async function revokeCourseCategory(
  sgId: number,
  categoryId: number,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`${BASE}/admin/subgroups/${sgId}/course-categories/${categoryId}/`);
  return data;
}

// ── Group Audit Logs ──

export interface GroupAuditLogsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: GroupAuditLogItem[];
}

export async function getGroupAuditLogs(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
}): Promise<GroupAuditLogsResponse> {
  const { data } = await apiClient.get(`${BASE}/admin/group-audit-logs/`, { params });
  return data;
}

// ── My Role API (learner_plus) ──

export interface MyRoleResponse {
  role: string | null;
  group_ids: number[];
  group_names: string[];
}

export async function getMyRole(): Promise<MyRoleResponse> {
  const { data } = await apiClient.get(`${BASE}/v0/my-role/`);
  return data;
}
