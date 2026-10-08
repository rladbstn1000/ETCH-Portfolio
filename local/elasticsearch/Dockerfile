FROM docker.elastic.co/elasticsearch/elasticsearch:9.4.7@sha256:e089a3f5ab76a6fcd50e76d4e6f3b1555357790e840cc1c3012193e03fb08749
RUN bin/elasticsearch-plugin install --batch analysis-nori
USER 0
# Signed public UBI 9 packages only; supplier Elasticsearch/JDK/Nori files stay unchanged.
RUN microdnf update -y --setopt=install_weak_deps=0 \
      coreutils-single-8.32-41.el9_8.1 \
      curl-minimal-7.76.1-40.el9_8.7 libcurl-minimal-7.76.1-40.el9_8.7 \
      libevent-2.1.13-1.el9_8 libxml2-2.9.13-14.el9_8.5 \
      openssl-libs-1:3.5.8-1.el9_8 \
    && microdnf clean all
USER 1000:0
