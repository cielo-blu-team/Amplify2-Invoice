// 案件ステータス
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'suspended' | 'lost';

// 優先度
export type ProjectPriority = 'low' | 'medium' | 'high';

// 案件（Projects テーブル）
export interface Project {
  PK: string; // PROJECT#{projectId}
  SK: 'META';
  projectId: string;
  projectName: string;
  clientId?: string;
  clientName?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  description?: string;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  budget?: number;
  assignedTo?: string;
  notes?: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 案件作成入力
export interface ProjectCreateInput {
  projectName: string;
  clientId?: string;
  clientName?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  assignedTo?: string;
  notes?: string;
  createdBy: string;
}

// 案件更新入力
export type ProjectUpdateInput = Partial<Omit<ProjectCreateInput, 'createdBy'>>;

// 案件一覧フィルタ
export interface ProjectListFilters {
  status?: ProjectStatus;
  keyword?: string;
  limit?: number;
  cursor?: string;
}
