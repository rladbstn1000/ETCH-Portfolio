import { copy, requireItem, showcaseState } from '../state';
export const getCompany = async (id: number) => copy(requireItem(showcaseState.companies, id));
