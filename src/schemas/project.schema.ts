import { z } from 'zod';

export const projectCreateSchema = z.object({
  projectName: z.string().min(1, '案件名を入力してください').max(200),
  clientId: z.string().optional(),
  clientName: z.string().max(200).optional(),
  status: z.enum(['planning', 'in_progress', 'completed', 'suspended', 'lost']),
  priority: z.enum(['low', 'medium', 'high']),
  description: z.string().max(2000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().int().min(0).optional(),
  assignedTo: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  createdBy: z.string().min(1),
});

export const projectUpdateSchema = projectCreateSchema
  .omit({ createdBy: true })
  .partial()
  .extend({ projectId: z.string().min(1) });
