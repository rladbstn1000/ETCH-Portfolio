import type { JobListParams } from '../../types/job';
import { copy, requireItem, showcaseState } from '../state';
export const getJob = async (id: number) => copy(requireItem(showcaseState.jobs, id));
export const getJobsList = async ({ start, end }: JobListParams) => copy(showcaseState.jobs.filter(job => job.openingDate.slice(0, 10) <= end && job.expirationDate.slice(0, 10) >= start));
export const getExpiringJobs = async ({ start, end }: JobListParams) => copy(showcaseState.jobs.filter(job => job.expirationDate.slice(0, 10) >= start && job.expirationDate.slice(0, 10) <= end));
