import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialJobs, initialNews, initialProjects, virtualMember } from '../data';
import { getShowcaseVersion, resetShowcase, showcaseState, subscribeShowcase } from '../state';
import { searchAll, searchJobs, searchNews, searchProjects } from './searchApi';
import { getJob, getJobsList } from './jobApi';
import { likeApi } from './likeApi';
import { getCoverLetterDetail, updateCoverLetter } from './coverLetterApi';
import { getPortfolioDetail, updatePortfolio } from './portfolioApi';
import { applyJob, getAppliedJobsList, updateAppliedJobStatus } from './appliedJobApi';

beforeEach(resetShowcase);
describe('공개 화면 체험 데이터 공급부', () => {
  it('평가 코퍼스와 분리된 공개 예시 필드만 제공한다', () => {
    expect([initialJobs.length, initialNews.length, initialProjects.length]).toEqual([8, 6, 6]);
    expect(virtualMember.email).toBe('');
    expect(initialProjects.every(item => item.isPublic && !item.isDeleted && item.githubUrl === '' && item.youtubeUrl === '')).toBe(true);
    expect(initialNews.every(item => item.url === '')).toBe(true);
    expect(showcaseState.portfolios.every(item => !item.email && !item.phoneNumber)).toBe(true);
  });
  it('검색어 변경·0건·따옴표 검색과 지역·직무 교집합을 일관되게 적용한다', async () => {
    expect((await searchAll('React')).jobs.content.map(item => item.id)).toEqual([1001, 1004]);
    expect((await searchJobs({ keyword: 'React', regions: ['서울'], jobCategories: ['프론트엔드'] })).content.map(item => item.id)).toEqual([1001]);
    expect((await searchJobs({ keyword: 'React', regions: ['서울'], jobCategories: ['백엔드'] })).content).toEqual([]);
    expect((await searchAll('존재하지않는단어')).jobs.content).toEqual([]);
    expect((await searchNews({ keyword: '"빈 화면"' })).content.map(item => item.id)).toEqual([2004]);
    expect((await searchProjects({ keyword: 'React' })).content.map(item => item.projectId)).toEqual([3006, 3001]);
  });
  it('페이지·정렬·날짜 요청과 없는 상세 항목을 처리한다', async () => {
    expect((await searchJobs({ page: 1, size: 3 })).content.map(item => item.id)).toEqual([1004, 1005, 1006]);
    expect((await searchProjects({ page: 0, size: 2, sort: 'POPULAR' })).page.nextPage).toBe(1);
    expect(await getJobsList({ start: '2026-12-01', end: '2026-12-31' })).toEqual([]);
    await expect(getJob(9999)).rejects.toThrow('예시');
  });
  it('반환 데이터 수정이 원본을 변경하지 않으며 스크랩은 멱등이고 초기화된다', async () => {
    const job = await getJob(1001); job.title = '바꾼 제목';
    expect((await getJob(1001)).title).not.toBe('바꾼 제목');
    const initial = showcaseState.projects[0].likeCount;
    await likeApi.projects.addLike(3001); await likeApi.projects.addLike(3001);
    expect(showcaseState.projects[0].likeCount).toBe(initial + 1);
    expect((await likeApi.projects.getLikes()).map(item => item.id)).toContain(3001);
    resetShowcase();
    expect(showcaseState.projects[0].likeCount).toBe(initial);
    expect((await likeApi.projects.getLikes()).map(item => item.id)).not.toContain(3001);
  });
  it('예시 편집·상태 변경은 메모리 구독으로 알리고 초기화되며 실제 지원은 차단한다', async () => {
    const subscriber = vi.fn(); const unsubscribe = subscribeShowcase(subscriber); const before = getShowcaseVersion();
    const letter = await getCoverLetterDetail(5001); await updateCoverLetter(5001, { ...letter, answer1: '화면 편집 예시' });
    expect((await getCoverLetterDetail(5001)).answer1).toBe('화면 편집 예시');
    await updatePortfolio(6001, { name: '바꾼 예시', introduce: '화면 예시', phoneNumber: '입력하지 않는 필드', email: '입력하지 않는 필드', projectIds: [3001, 9999] });
    expect(await getPortfolioDetail(6001)).toMatchObject({ name: '바꾼 예시', email: '', phoneNumber: '' });
    expect((await getPortfolioDetail(6001)).projectList.map(item => item.id)).toEqual([3001]);
    await updateAppliedJobStatus(9001, { status: 'INTERVIEW_DONE' });
    expect((await getAppliedJobsList())[0].status).toBe('INTERVIEW_DONE');
    await expect(applyJob(1001)).rejects.toThrow('제출하지 않습니다');
    expect(getShowcaseVersion()).toBeGreaterThan(before); expect(subscriber).toHaveBeenCalled(); unsubscribe();
    resetShowcase(); expect((await getCoverLetterDetail(5001)).answer1).toBe(letter.answer1);
  });
});
