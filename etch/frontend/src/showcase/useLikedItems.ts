import { useSyncExternalStore } from 'react';
import { getShowcaseVersion, showcaseState, subscribeShowcase } from './state';
import { likeApi } from './api/likeApi';

type Kind = 'jobs' | 'news' | 'companies';
function useLikes(kind: Kind) {
  useSyncExternalStore(subscribeShowcase, getShowcaseVersion, getShowcaseVersion);
  return {
    ids: new Set(showcaseState.likes[kind]),
    add: likeApi[kind].addLike,
    remove: likeApi[kind].removeLike,
    contains: (id: number) => showcaseState.likes[kind].includes(id),
  };
}
// 모든 카드/모달은 같은 메모리 상태를 구독한다. API 후 콜백도 멱등이다.
export function useLikedJobs() {
  const likes = useLikes('jobs');
  return { likedJobIds: likes.ids, isLoading: false, addLikedJob: likes.add, removeLikedJob: likes.remove, isJobLiked: likes.contains };
}
export function useLikedNews() {
  const likes = useLikes('news');
  return { likedNewsIds: likes.ids, isLoading: false, addLikedNews: likes.add, removeLikedNews: likes.remove, isNewsLiked: likes.contains };
}
export function useLikedCompanies() {
  const likes = useLikes('companies');
  return { likedCompanyIds: likes.ids, isLoading: false, addLikedCompany: likes.add, removeLikedCompany: likes.remove, isCompanyLiked: likes.contains };
}
