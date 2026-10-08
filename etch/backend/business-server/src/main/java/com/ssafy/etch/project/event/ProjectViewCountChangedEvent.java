package com.ssafy.etch.project.event;

public record ProjectViewCountChangedEvent(Long projectId) {
	public static ProjectViewCountChangedEvent of(Long projectId) {
		return new ProjectViewCountChangedEvent(projectId);
	}
}
