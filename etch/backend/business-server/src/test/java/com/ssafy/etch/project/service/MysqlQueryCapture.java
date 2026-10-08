package com.ssafy.etch.project.service;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.temporal.TemporalAccessor;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * Test-only JDBC invocation capture. No ResultSet is read, and no connection state is changed.
 * SQL preparation and bind setters are not counted as executions. Call start before the measured
 * controller/service/JSON path and stop afterwards, on the same thread.
 */
public final class MysqlQueryCapture {
    private MysqlQueryCapture() {}

    public record Execution(String sql, Map<Integer, Object> parameters, String jdbcMethod, boolean success) {}

    private static final ThreadLocal<List<Execution>> ACTIVE = new ThreadLocal<>();

    public static void start() {
        if (ACTIVE.get() != null) throw new IllegalStateException("JDBC capture is already active on this thread");
        ACTIVE.set(new ArrayList<>());
    }

    public static List<Execution> stop() {
        List<Execution> executions = ACTIVE.get();
        ACTIVE.remove();
        return executions == null ? List.of() : List.copyOf(executions);
    }

    @TestConfiguration(proxyBeanMethods = false)
    public static class Config {
        @Bean
        static BeanPostProcessor mysqlQueryCaptureDataSourcePostProcessor() {
            return new BeanPostProcessor() {
                @Override
                public Object postProcessAfterInitialization(Object bean, String beanName) {
                    if (!(bean instanceof DataSource) || handledBy(bean, DataSourceHandler.class)) return bean;
                    Class<?>[] interfaces = bean instanceof AutoCloseable
                        ? new Class<?>[]{DataSource.class, AutoCloseable.class} : new Class<?>[]{DataSource.class};
                    return Proxy.newProxyInstance(MysqlQueryCapture.class.getClassLoader(), interfaces, new DataSourceHandler(bean));
                }
            };
        }
    }

    private record DataSourceHandler(Object target) implements InvocationHandler {
        @Override
        public Object invoke(Object proxy, Method method, Object[] arguments) throws Throwable {
            Object result = delegate(target, method, arguments);
            if (method.getName().equals("getConnection") && result instanceof Connection connection
                    && !handledBy(connection, ConnectionHandler.class)) {
                return Proxy.newProxyInstance(MysqlQueryCapture.class.getClassLoader(),
                    new Class<?>[]{Connection.class}, new ConnectionHandler(connection));
            }
            // In particular, unwrap/isWrapperFor are delegated to the original DataSource.
            return result;
        }
    }

    private record ConnectionHandler(Connection target) implements InvocationHandler {
        @Override
        public Object invoke(Object proxy, Method method, Object[] arguments) throws Throwable {
            Object result = delegate(target, method, arguments);
            if ((method.getName().equals("prepareStatement") || method.getName().equals("prepareCall")
                    || method.getName().equals("createStatement")) && result instanceof Statement statement
                    && !handledBy(statement, StatementHandler.class)) {
                String sql = arguments != null && arguments.length > 0 && arguments[0] instanceof String text
                    ? text : null;
                Class<?> api = statement instanceof CallableStatement ? CallableStatement.class
                    : statement instanceof PreparedStatement ? PreparedStatement.class : Statement.class;
                return Proxy.newProxyInstance(MysqlQueryCapture.class.getClassLoader(),
                    new Class<?>[]{api}, new StatementHandler(statement, sql));
            }
            return result;
        }
    }

    private static final class StatementHandler implements InvocationHandler {
        private final Statement target;
        private final String preparedSql;
        private final Map<Integer, Object> parameters = new LinkedHashMap<>();
        private final List<BatchItem> batch = new ArrayList<>();

        private StatementHandler(Statement target, String preparedSql) {
            this.target = target;
            this.preparedSql = preparedSql;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] arguments) throws Throwable {
            String name = method.getName();
            if (isExecution(name)) {
                String sql = preparedSql;
                Map<Integer, Object> binds = snapshot(parameters);
                boolean batchCall = name.equals("executeBatch") || name.equals("executeLargeBatch");
                if (batchCall) {
                    // One Execution is one JDBC batch invocation, not one record per batch row.
                    // Parameters are a 1-based batch-entry -> bind-map. Plain Statement batches
                    // carry their ordered SQL in this record; this list measurement uses no batch.
                    Map<Integer, Object> entries = new LinkedHashMap<>();
                    for (int index = 0; index < batch.size(); index++) entries.put(index + 1, batch.get(index).parameters());
                    binds = snapshot(entries);
                    if (preparedSql == null) sql = String.join(";\n", batch.stream().map(BatchItem::sql).toList());
                } else if (arguments != null && arguments.length > 0 && arguments[0] instanceof String text) {
                    sql = text;
                    binds = Map.of();
                }
                try {
                    Object result = delegate(target, method, arguments);
                    record(sql, binds, name, true);
                    return result;
                } catch (Throwable failure) {
                    record(sql, binds, name, false);
                    throw failure;
                } finally {
                    if (batchCall) batch.clear();
                }
            }

            Object result = delegate(target, method, arguments);
            if (name.equals("clearParameters")) parameters.clear();
            else if (name.equals("clearBatch")) batch.clear();
            else if (name.equals("addBatch")) {
                String sql = arguments != null && arguments.length > 0 && arguments[0] instanceof String text
                    ? text : preparedSql;
                batch.add(new BatchItem(sql, preparedSql == null ? Map.of() : snapshot(parameters)));
            } else if (target instanceof PreparedStatement && name.startsWith("set")
                    && arguments != null && arguments.length >= 2 && arguments[0] instanceof Integer index) {
                parameters.put(index, name.equals("setNull") ? null : jsonValue(arguments[1]));
            }
            return result;
        }
    }

    private record BatchItem(String sql, Map<Integer, Object> parameters) {}

    private static boolean isExecution(String name) {
        return switch (name) {
            case "executeQuery", "executeUpdate", "execute", "executeBatch", "executeLargeUpdate", "executeLargeBatch" -> true;
            default -> false;
        };
    }

    private static void record(String sql, Map<Integer, Object> binds, String method, boolean success) {
        List<Execution> executions = ACTIVE.get();
        if (executions != null) executions.add(new Execution(sql, binds, method, success));
    }

    private static Map<Integer, Object> snapshot(Map<Integer, Object> values) {
        // Map.copyOf rejects JDBC null parameters, which are meaningful evidence.
        return Collections.unmodifiableMap(new LinkedHashMap<>(values));
    }

    private static Object jsonValue(Object value) {
        if (value == null || value instanceof String || value instanceof Number || value instanceof Boolean) return value;
        if (value instanceof byte[] bytes) return HexFormat.of().formatHex(bytes);
        if (value instanceof java.sql.Timestamp timestamp) return timestamp.toLocalDateTime().toString();
        if (value instanceof java.sql.Date date) return date.toLocalDate().toString();
        if (value instanceof java.sql.Time time) return time.toLocalTime().toString();
        if (value instanceof TemporalAccessor || value instanceof Character) return value.toString();
        // Never consume streams, LOBs, or driver objects just to produce test evidence.
        return "<" + value.getClass().getName() + ">";
    }

    private static boolean handledBy(Object value, Class<? extends InvocationHandler> type) {
        return Proxy.isProxyClass(value.getClass()) && type.isInstance(Proxy.getInvocationHandler(value));
    }

    private static Object delegate(Object target, Method method, Object[] arguments) throws Throwable {
        try {
            return method.invoke(target, arguments);
        } catch (InvocationTargetException exception) {
            throw exception.getCause();
        }
    }
}
