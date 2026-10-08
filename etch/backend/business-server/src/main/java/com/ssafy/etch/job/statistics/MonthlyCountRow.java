package com.ssafy.etch.job.statistics;

public interface MonthlyCountRow {
	String getYm();   // "YYYY-MM"

	Long getCnt();
}
