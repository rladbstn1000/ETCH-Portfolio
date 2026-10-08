FROM curlimages/curl:8.20.0@sha256:be02b215a89b9e9fba000ead2d817e125d265c52de57030c66f4ecfd1688be35 AS jdbc
USER 0
RUN apk add --no-cache --upgrade c-ares=1.34.8-r0 libcrypto3=3.5.8-r0 libssl3=3.5.8-r0 libssh2=1.11.1-r3
USER curl_user
RUN curl --fail --location --retry 3 https://repo.maven.apache.org/maven2/com/mysql/mysql-connector-j/26.7.0/mysql-connector-j-26.7.0.jar -o /tmp/mysql.jar \
    && echo "69084713593a4aa8d07c383619b9639276f08bccf8faf1c562178147d389b1e1  /tmp/mysql.jar" | sha256sum -c -
FROM docker.elastic.co/logstash/logstash:9.5.4@sha256:584b36c37bfb1553f20df6ad9a5dd37d5a9468d38988059bfff38b9a656ca795
# Only unused plugins, removed through the supported plugin manager; core JDBC/ES/DLQ plugins remain.
RUN bin/logstash-plugin remove logstash-filter-elastic_integration logstash-integration-rabbitmq logstash-filter-memcached
USER 0
# Signed public UBI 9 packages only; no manual replacement of supplier JARs/gems.
RUN microdnf update -y --setopt=install_weak_deps=0 \
      coreutils-single-8.32-41.el9_8.1 \
      curl-minimal-7.76.1-40.el9_8.7 libcurl-minimal-7.76.1-40.el9_8.7 \
      libevent-2.1.13-1.el9_8 libxml2-2.9.13-14.el9_8.5 \
      openssl-1:3.5.8-1.el9_8 openssl-libs-1:3.5.8-1.el9_8 \
    && microdnf clean all
USER 1000
COPY --from=jdbc /tmp/mysql.jar /usr/share/logstash/mysql.jar
COPY local/logstash/pipeline/ /usr/share/logstash/pipeline/
COPY local/logstash/pipelines.yml local/logstash/logstash.yml /usr/share/logstash/config/
COPY local/logstash/query/ /usr/share/logstash/query/
COPY local/logstash/normalize.rb local/logstash/dlq-inspect.conf /usr/share/logstash/
