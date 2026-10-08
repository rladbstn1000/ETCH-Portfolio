package com.ssafy.etch.project.event;

public record ProjectChangedEvent(Long projectId, ChangeType type) {
	public enum ChangeType {UPSERT, DELETE}
}
