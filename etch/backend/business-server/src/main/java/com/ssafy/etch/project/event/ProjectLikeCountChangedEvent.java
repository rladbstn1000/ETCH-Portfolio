package com.ssafy.etch.project.event;

public record ProjectLikeCountChangedEvent(Long projectId) {
	public static ProjectLikeCountChangedEvent of(Long projectId) {
		return new ProjectLikeCountChangedEvent(projectId);
	}
}

