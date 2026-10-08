import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { useLikedJobs } from './useLikedItems';
import { resetShowcase, showcaseState } from './state';
import { likeApi } from './api/likeApi';

beforeEach(resetShowcase);
afterEach(cleanup);
it('별개 카드/모달 훅이 같은 스크랩·취소·초기화 상태를 즉시 읽는다', async () => {
  const first = renderHook(useLikedJobs);
  const second = renderHook(useLikedJobs);
  expect(first.result.current.isJobLiked(1002)).toBe(false);
  await act(async () => { await likeApi.jobs.addLike(1002); await first.result.current.addLikedJob(1002); });
  expect(first.result.current.likedJobIds.has(1002)).toBe(true);
  expect(second.result.current.likedJobIds.has(1002)).toBe(true);
  expect(showcaseState.likes.jobs.filter(id => id === 1002)).toHaveLength(1);
  await act(async () => { await second.result.current.removeLikedJob(1002); });
  expect(first.result.current.isJobLiked(1002)).toBe(false);
  await act(async () => { await first.result.current.removeLikedJob(1001); });
  act(resetShowcase);
  expect(first.result.current.isJobLiked(1001)).toBe(true);
  expect(second.result.current.isJobLiked(1001)).toBe(true);
});
