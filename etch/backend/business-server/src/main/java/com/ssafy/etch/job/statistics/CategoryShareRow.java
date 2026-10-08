package com.ssafy.etch.job.statistics;

public interface CategoryShareRow {
	String getCategory();

	Long getCnt();

	Double getPct(); // 0~100
}
