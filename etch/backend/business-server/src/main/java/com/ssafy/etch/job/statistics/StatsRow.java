package com.ssafy.etch.job.statistics;

public interface StatsRow {
	Long getDocPassCnt();

	Long getDocTotalCnt();

	Long getInterviewPassCnt();

	Long getInterviewTotalCnt();

	Long getFinalCnt();

	Long getFinalTotalCnt();
}
