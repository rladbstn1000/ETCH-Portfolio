package com.ssafy.etch.demo;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/** Closed HTTP surface. This policy is independent of the reverse proxy and of JWT contents. */
public final class PublicDemoRequestPolicy {
    private static final Set<String> SEARCH_PATHS = Set.of("/search", "/jobs/search", "/news/search", "/projects/search");
    private static final Pattern DETAIL = Pattern.compile("/(jobs|companies|projects)/[1-9][0-9]*|/news/companies/[1-9][0-9]*");
    private static final Pattern FILTER_TEXT = Pattern.compile("[\\p{L}\\p{N} /+()._-]{1,50}");
    private static final Set<String> PROJECT_SORTS = Set.of("LATEST", "VIEWS", "LIKES");
    private static final Set<String> PROJECT_CATEGORIES = Set.of("WEB", "MOBILE", "SECURITY", "DEVOPS", "SERVER", "DATABASE");

    private PublicDemoRequestPolicy() {}

    public static String path(HttpServletRequest request) {
        return request.getRequestURI().substring(request.getContextPath().length());
    }

    public static boolean allows(HttpServletRequest request) {
        return ("GET".equals(request.getMethod()) || "HEAD".equals(request.getMethod()))
            && (SEARCH_PATHS.contains(path(request)) || DETAIL.matcher(path(request)).matches() || "/health".equals(path(request)));
    }

    public static void validate(HttpServletRequest request) {
        String path = path(request);
        Map<String, String[]> params = request.getParameterMap();
        Set<String> accepted = new HashSet<>();
        if (SEARCH_PATHS.contains(path)) accepted.addAll(Set.of("keyword", "page", "size"));
        if ("/jobs/search".equals(path)) accepted.addAll(Set.of("regions", "jobCategories", "workType", "educationLevel"));
        if ("/projects/search".equals(path)) accepted.addAll(Set.of("sort", "category"));
        boolean companyNews = path.startsWith("/news/companies/");
        if (companyNews) accepted.addAll(Set.of("page", "pageSize"));
        if (!accepted.containsAll(params.keySet())) invalid();
        params.forEach((key, values) -> {
            if (values == null || values.length == 0) invalid();
            if (!Set.of("regions", "jobCategories").contains(key) && values.length != 1) invalid();
            if (values.length > 8) invalid();
        });

        String keyword = request.getParameter("keyword");
        if (keyword != null && (keyword.codePointCount(0, keyword.length()) > 100
            || keyword.codePoints().anyMatch(Character::isISOControl))) invalid();
        for (String key : Set.of("regions", "jobCategories", "workType", "educationLevel")) {
            String[] values = params.get(key);
            if (values == null) continue;
            // Spring's List binding also splits comma-delimited values; bound both representations.
            String[] tokens = Arrays.stream(values).flatMap(value -> Arrays.stream(value.split(",", -1))).toArray(String[]::new);
            if (tokens.length > 8 || Arrays.stream(tokens).anyMatch(value -> !FILTER_TEXT.matcher(value).matches())) invalid();
        }
        if (params.containsKey("sort") && !PROJECT_SORTS.contains(request.getParameter("sort"))) invalid();
        if (params.containsKey("category") && !PROJECT_CATEGORIES.contains(request.getParameter("category"))) invalid();
        if (SEARCH_PATHS.contains(path) || companyNews) {
            int firstPage = companyNews ? 1 : 0;
            int page = number(request.getParameter("page"), firstPage);
            int size = number(request.getParameter(companyNews ? "pageSize" : "size"), 10);
            if (page < firstPage || page - firstPage > 19 || size < 1 || size > (companyNews ? 10 : 100)
                || (long)(page - firstPage + 1) * size > 1000) invalid();
        }
        if (DETAIL.matcher(path).matches()) {
            try { if (Long.parseLong(path.substring(path.lastIndexOf('/') + 1)) < 1) invalid(); }
            catch (NumberFormatException exception) { invalid(); }
        }
    }

    private static int number(String text, int fallback) {
        if (text == null) return fallback;
        if (!text.matches("[0-9]{1,4}")) { invalid(); }
        try { return Integer.parseInt(text); }
        catch (NumberFormatException exception) { throw new IllegalArgumentException("Invalid demo request"); }
    }

    private static void invalid() { throw new IllegalArgumentException("Invalid demo request"); }
}
