import { changedShowcase, showcaseState } from '../state';
import { publicAssets } from '../data';
const colleague = { id: 7002, nickname: '가상 동료', email: '', profile: publicAssets.profile };
export const getFollowers = async () => [{ ...colleague }];
export const getFollowings = async () => showcaseState.following.map(id => ({ ...colleague, id }));
export const getCountFollows = async (_id: number) => ({ followerCount: 1, followingCount: showcaseState.following.length });
export const checkFollowExists = async (id: number) => showcaseState.following.includes(id);
export const followUser = async (id: number) => { if (!showcaseState.following.includes(id)) { showcaseState.following.push(id); changedShowcase(); } };
export const unfollowUser = async (id: number) => { showcaseState.following = showcaseState.following.filter(item => item !== id); changedShowcase(); };
