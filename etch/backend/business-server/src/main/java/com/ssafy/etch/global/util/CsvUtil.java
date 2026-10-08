package com.ssafy.etch.global.util;

import java.util.Arrays;
import java.util.List;

public final class CsvUtil {
	private CsvUtil() {
	}

	public static List<String> splitCsv(String value) {
		if (value == null || value.isBlank())
			return List.of();
		return Arrays.stream(value.split(","))
			.map(String::trim)
			.filter(s -> !s.isEmpty())
			.distinct()
			.toList();
	}
}
