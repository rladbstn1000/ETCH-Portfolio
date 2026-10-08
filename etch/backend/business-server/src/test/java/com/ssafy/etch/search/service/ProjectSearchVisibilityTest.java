package com.ssafy.etch.search.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.ssafy.etch.global.exception.GlobalExceptionHandler;
import com.ssafy.etch.project.repository.ProjectRepository;
import com.ssafy.etch.search.controller.ProjectSearchController;
import com.ssafy.etch.search.controller.SearchController;
import com.ssafy.etch.search.document.ProjectDocument;
import com.ssafy.etch.search.enumeration.ProjectSort;

@ExtendWith(MockitoExtension.class)
class ProjectSearchVisibilityTest {
	@Mock ElasticsearchOperations elasticsearch;
	@Mock ProjectRepository projects;
	ProjectSearchService service;

	@BeforeEach
	void setUp() {
		service = new ProjectSearchService(elasticsearch, projects);
	}

	@Test
	void oneBatchDbCheckRemovesAllFieldsOfPrivateDeletedAndMissingDocuments() {
		givenHits(4, document(11L, "public"), document(12L, "private-secret"),
			document(13L, "deleted-secret"), document(14L, "missing-secret"));
		when(projects.findPublicIdsByIdIn(List.of(11L, 12L, 13L, 14L))).thenReturn(List.of(11L));

		var result = service.search("합성", null, null, 0, 4);

		assertThat(result.content()).extracting("projectId").containsExactly(11L);
		assertThat(result.content().get(0).getTitle()).isEqualTo("public");
		assertThat(result.page().totalElements()).isNull();
		assertThat(result.page().totalPages()).isNull();
		assertThat(result.page().totalExact()).isFalse();
		assertThat(result.page().hasNext()).isFalse();
		verify(projects).findPublicIdsByIdIn(List.of(11L, 12L, 13L, 14L));
		verify(projects, never()).findById(any());
	}

	@Test
	void entirelyHiddenCandidateWindowStillOffersNextWithoutClaimingZeroTotal() {
		givenHits(5, document(11L, "private"), document(12L, "deleted"));
		when(projects.findPublicIdsByIdIn(List.of(11L, 12L))).thenReturn(List.of());

		var result = service.search("합성", null, null, 0, 2);

		assertThat(result.content()).isEmpty();
		assertThat(result.page().hasNext()).isTrue();
		assertThat(result.page().nextPage()).isEqualTo(1);
		assertThat(result.page().totalElements()).isNull();
	}

	@Test
	void nextPageKeepsOriginalCandidateOffsetAndOrder() {
		givenHits(5, document(13L, "first-visible"), document(14L, "second-visible"));
		when(projects.findPublicIdsByIdIn(List.of(13L, 14L))).thenReturn(List.of(14L, 13L));

		var result = service.search("합성", null, null, 1, 2);

		assertThat(result.content()).extracting("projectId").containsExactly(13L, 14L);
		assertThat(result.page().number()).isEqualTo(1);
		assertThat(result.page().hasPrevious()).isTrue();
		assertThat(result.page().nextPage()).isEqualTo(2);
		ArgumentCaptor<NativeQuery> query = ArgumentCaptor.forClass(NativeQuery.class);
		verify(elasticsearch).search(query.capture(), eq(ProjectDocument.class));
		assertThat(query.getValue().getPageable().getOffset()).isEqualTo(2);
	}

	@Test
	void noHitsAndBlankQueryDoNotRequestEmptyInClause() {
		givenHits(0);
		assertThat(service.search("합성", null, null, 0, 3).page().hasNext()).isFalse();
		assertThat(service.search(" ", "", null, 0, 3).content()).isEmpty();
		verifyNoInteractions(projects);
	}

	@Test
	void databaseFailureFailsClosedRatherThanReturningEsContent() {
		givenHits(1, document(11L, "private-secret"));
		when(projects.findPublicIdsByIdIn(List.of(11L)))
			.thenThrow(new DataAccessResourceFailureException("internal-db-address"));

		assertThatThrownBy(() -> service.search("합성", null, null, 0, 3))
			.isInstanceOf(DataAccessResourceFailureException.class);
	}

	@Test
	void queryExcludesTombstonesAndTreatsQuotesAsAValue() {
		givenHits(0);
		String keyword = "합성 \"따옴표\" \\ 검색";
		service.search(keyword, "BACKEND", ProjectSort.LIKES, 0, 3);
		ArgumentCaptor<NativeQuery> query = ArgumentCaptor.forClass(NativeQuery.class);
		verify(elasticsearch).search(query.capture(), eq(ProjectDocument.class));
		var bool = query.getValue().getQuery().bool();
		assertThat(bool.must().get(0).multiMatch().query()).isEqualTo(keyword);
		assertThat(bool.filter().get(0).term().field()).isEqualTo("visible");
		assertThat(bool.filter().get(0).term().value().booleanValue()).isTrue();
		assertThat(bool.filter().get(1).term().value().stringValue()).isEqualTo("BACKEND");
	}

	@Test
	void projectAndUnifiedHttpResponsesShareVisibilityAndUnknownCountContract() throws Exception {
		givenHits(3, document(11L, "private-secret"), document(12L, "public"));
		when(projects.findPublicIdsByIdIn(List.of(11L, 12L))).thenReturn(List.of(12L));
		JobSearchService jobs = mock(JobSearchService.class);
		NewsSearchService news = mock(NewsSearchService.class);
		when(jobs.searchWithFilters("합성", null, null, null, null, 0, 2)).thenReturn(Page.empty(PageRequest.of(0, 2)));
		when(news.search("합성", 0, 2)).thenReturn(Page.empty(PageRequest.of(0, 2)));
		MockMvc http = MockMvcBuilders.standaloneSetup(new ProjectSearchController(service),
			new SearchController(jobs, news, service)).setControllerAdvice(new GlobalExceptionHandler()).build();

		http.perform(get("/projects/search").param("keyword", "합성").param("size", "2"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.content.length()").value(1))
			.andExpect(jsonPath("$.data.content[0].projectId").value(12))
			.andExpect(jsonPath("$.data.page.totalElements").value(nullValue()))
			.andExpect(jsonPath("$.data.page.totalPages").value(nullValue()))
			.andExpect(jsonPath("$.data.page.totalExact").value(false))
			.andExpect(jsonPath("$.data.page.hasNext").value(true))
			.andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("private-secret"))));
		http.perform(get("/search").param("keyword", "합성").param("size", "2"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.projects.content.length()").value(1))
			.andExpect(jsonPath("$.data.projects.content[0].projectId").value(12))
			.andExpect(jsonPath("$.data.projects.page.totalElements").value(nullValue()))
			.andExpect(jsonPath("$.data.projects.page.hasNext").value(true))
			.andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("private-secret"))));
	}

	@Test
	void searchDependencyFailureIs503WithSafeBodyAndCanRecoverToRealEmptyResponse() throws Exception {
		when(elasticsearch.search(any(NativeQuery.class), eq(ProjectDocument.class)))
			.thenThrow(new DataAccessResourceFailureException("http://internal-address:9200?token=sensitive"));
		MockMvc http = MockMvcBuilders.standaloneSetup(new ProjectSearchController(service))
			.setControllerAdvice(new GlobalExceptionHandler()).build();
		http.perform(get("/projects/search").param("keyword", "합성"))
			.andExpect(status().isServiceUnavailable())
			.andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("internal-address"))))
			.andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("sensitive"))));

		givenHits(0);
		http.perform(get("/projects/search").param("keyword", "합성"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.content").isEmpty())
			.andExpect(jsonPath("$.data.page.hasNext").value(false));
		verifyNoInteractions(projects);
	}

	@Test
	void invalidPageFailsBeforeAnyDependencyRequest() {
		assertThatThrownBy(() -> service.search("합성", null, null, -1, 3))
			.isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> service.search(" ", null, null, 0, 0))
			.isInstanceOf(IllegalArgumentException.class);
		verifyNoInteractions(elasticsearch, projects);
	}

	private ProjectDocument document(long id, String title) {
		return ProjectDocument.builder().projectId(id).title(title).thumbnailUrl(title + ".png")
			.memberName("synthetic-member").viewCount(0L).likeCount(0).build();
	}

	@SuppressWarnings("unchecked")
	private void givenHits(long total, ProjectDocument... documents) {
		SearchHits<ProjectDocument> hits = mock(SearchHits.class);
		List<SearchHit<ProjectDocument>> items = java.util.Arrays.stream(documents).map(document -> {
			SearchHit<ProjectDocument> hit = mock(SearchHit.class);
			when(hit.getContent()).thenReturn(document);
			return hit;
		}).toList();
		when(hits.getSearchHits()).thenReturn(items);
		// A fail-closed DB exception intentionally returns before pagination metadata is read.
		org.mockito.Mockito.lenient().when(hits.getTotalHits()).thenReturn(total);
		org.mockito.Mockito.doReturn(hits).when(elasticsearch).search(any(NativeQuery.class), eq(ProjectDocument.class));
	}
}
