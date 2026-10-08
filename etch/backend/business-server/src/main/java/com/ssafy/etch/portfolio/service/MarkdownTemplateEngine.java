package com.ssafy.etch.portfolio.service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;

public class MarkdownTemplateEngine {

    // 템플릿 파일 읽기
    public String loadTemplate(String path) {
        try (InputStream is = getClass().getResourceAsStream(path);
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            return reader.lines().collect(Collectors.joining("\n"));
        } catch (IOException e) {
            throw new RuntimeException("템플릿 파일 읽기 실패", e);
        }
    }

    // 일반 변수 치환
    private String replaceVariables(String template, Map<String, Object> data) {
        Pattern varPattern = Pattern.compile("\\{\\{([\\w\\.]+)\\}\\}");
        Matcher matcher = varPattern.matcher(template);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String keyPath = matcher.group(1);
            Object value = resolveValue(keyPath, data);
            matcher.appendReplacement(sb, Matcher.quoteReplacement(value != null ? value.toString() : ""));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    // {% for ... %} 처리 (중첩 경로 지원)
    private String processLoops(String template, Map<String, Object> data) {
        Pattern loopPattern = Pattern.compile("\\{% for (\\w+) in (\\w+) %}(.*?)\\{% endfor %}", Pattern.DOTALL);
        Matcher matcher = loopPattern.matcher(template);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String itemName = matcher.group(1);
            String listName = matcher.group(2);
            String loopContent = matcher.group(3);

            Object listObj = data.get(listName);
            if (!(listObj instanceof List<?> list) || list.isEmpty()) {
                matcher.appendReplacement(sb, "");
                continue;
            }

            StringBuilder loopResult = new StringBuilder();
            for (int i = 0; i < list.size(); i++) {
                Object item = list.get(i);
                if (item instanceof Map<?, ?> itemMap) {
                    String rendered = loopContent;

                    // 조건문 처리 {% if not loop.last %} ... {% endif %}
                    rendered = rendered.replaceAll("\\{% if not loop.last %}(.*?)\\{% endif %}",
                            (i < list.size() - 1) ? "$1" : "");

                    // 변수 치환
                    for (Map.Entry<?, ?> entry : itemMap.entrySet()) {
                        String placeholder = "{{" + itemName + "." + entry.getKey() + "}}";
                        rendered = rendered.replace(placeholder, entry.getValue() != null ? entry.getValue().toString() : "");
                    }
                    loopResult.append(rendered.trim()).append("\n");
                }
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(loopResult.toString()));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }


    // {% if ... %} 조건문 처리 (중첩 경로 지원)
    private String processConditions(String template, Map<String, Object> data) {
        Pattern ifPattern = Pattern.compile("\\{% if ([\\w\\.]+) %}(.*?)(\\{% else %}(.*?))?\\{% endif %}", Pattern.DOTALL);
        Matcher matcher = ifPattern.matcher(template);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String conditionPath = matcher.group(1);
            String ifContent = matcher.group(2);
            String elseContent = matcher.group(4);

            Object value = resolveValue(conditionPath, data);
            boolean isTruthy = value != null && !(value instanceof String s && s.isBlank()) &&
                    !(value instanceof List<?> list && list.isEmpty());

            String replacement = isTruthy ? ifContent : (elseContent != null ? elseContent : "");
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement.trim()));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    // 경로 탐색 (ex: p.projectTechs → Map 내부 접근)
    @SuppressWarnings("unchecked")
    private Object resolveValue(String path, Map<String, Object> data) {
        String[] parts = path.split("\\.");
        Object current = data;
        for (String part : parts) {
            if (current instanceof Map<?, ?> map) {
                current = map.get(part);
            } else {
                return null;
            }
        }
        return current;
    }

    // 메인 렌더링
    public String render(String template, Map<String, Object> data) {
        String withLoops = processLoops(template, data);
        String withConditions = processConditions(withLoops, data);
        return replaceVariables(withConditions, data);
    }
}