import type { CoverLetterRequest } from '../../types/coverLetter';
import { changedShowcase, copy, requireItem, showcaseState } from '../state';
export const getCoverLetters = async () => showcaseState.coverLetters.map(({ id, name }) => ({ id, name }));
export const getCoverLetterDetail = async (id: number) => copy(requireItem(showcaseState.coverLetters, id));
const fields = (input: CoverLetterRequest): CoverLetterRequest => ({ name: input.name, answer1: input.answer1, answer2: input.answer2, answer3: input.answer3, answer4: input.answer4, answer5: input.answer5 });
export const createCoverLetter = async (input: CoverLetterRequest) => { showcaseState.coverLetters.push({ id: Math.max(5000, ...showcaseState.coverLetters.map(item => item.id)) + 1, ...fields(input) }); changedShowcase(); };
export const updateCoverLetter = async (id: number, input: CoverLetterRequest) => { const item = requireItem(showcaseState.coverLetters, id); Object.assign(item, fields(input)); changedShowcase(); return copy(item); };
export const deleteCoverLetter = async (id: number) => { showcaseState.coverLetters = showcaseState.coverLetters.filter(item => item.id !== id); changedShowcase(); };
