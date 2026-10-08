package com.ssafy.etch.search.listener;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import com.ssafy.etch.project.event.ProjectLikeCountChangedEvent;
import com.ssafy.etch.search.indexing.ProjectIndexOutbox;
import lombok.RequiredArgsConstructor;

/** Synchronous listener: an outbox failure must roll back the originating DB mutation. */
@Component
@RequiredArgsConstructor
public class ProjectLikeCountSync {
    private final ProjectIndexOutbox outbox;

    @EventListener
    public void onLikeChanged(ProjectLikeCountChangedEvent event) {
        outbox.enqueue(event.projectId());
    }
}
