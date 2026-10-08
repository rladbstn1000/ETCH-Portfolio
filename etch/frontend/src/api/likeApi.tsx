import { authInstance } from "./instances";
import type {
  LikeRequest,
  NewsLike,
  CompanyLike,
  JobLike,
  ProjectLike,
} from "../types/like";

export const likeApi = {
  news: {
    getLikes: async (): Promise<NewsLike[]> => {
      const response = await authInstance.get("/likes/news");
      return response.data.data;
    },

    addLike: async (targetId: number): Promise<void> => {
      const requestData: LikeRequest = { targetId };
      await authInstance.post("/likes/news", requestData);
    },

    removeLike: async (id: number): Promise<void> => {
      await authInstance.delete(`/likes/news/${id}`);
    },
  },

  companies: {
    getLikes: async (): Promise<CompanyLike[]> => {
      const response = await authInstance.get("/likes/companies");
      return response.data.data;
    },

    addLike: async (targetId: number): Promise<void> => {
      const requestData: LikeRequest = { targetId };
      await authInstance.post("/likes/companies", requestData);
    },

    removeLike: async (id: number): Promise<void> => {
      await authInstance.delete(`/likes/companies/${id}`);
    },
  },

  jobs: {
    getLikes: async (): Promise<JobLike[]> => {
      const response = await authInstance.get("/likes/jobs");
      return response.data.data;
    },

    addLike: async (targetId: number): Promise<void> => {
      const requestData: LikeRequest = { targetId };
      await authInstance.post("/likes/jobs", requestData);
    },

    removeLike: async (id: number): Promise<void> => {
      await authInstance.delete(`/likes/jobs/${id}`);
    },
  },

  projects: {
    getLikes: async (): Promise<ProjectLike[]> => {
      const response = await authInstance.get("/likes/projects");
      return response.data.data;
    },

    addLike: async (targetId: number): Promise<void> => {
      const requestData: LikeRequest = { targetId };
      await authInstance.post("/likes/projects", requestData);
    },

    removeLike: async (id: number): Promise<void> => {
      await authInstance.delete(`/likes/projects/${id}`);
    },
  },
};
