# Petclinic REST API image. Build context: spring-petclinic-rest/
ARG TEMURIN_VERSION=21.0.13_9

FROM docker.io/library/eclipse-temurin:${TEMURIN_VERSION}-jdk-noble AS build
WORKDIR /src

# Dependencies first so they are cached between builds.
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN sh mvnw -B -q dependency:go-offline || true

COPY src src
# Tests run in their own gate, not during the image build.
RUN sh mvnw -B -DskipTests package \
 && cp "$(ls target/spring-petclinic-rest-*.jar | grep -v original | head -1)" /app.jar

FROM docker.io/library/eclipse-temurin:${TEMURIN_VERSION}-jre-noble
WORKDIR /app
COPY --from=build /app.jar /app/app.jar

# Non-root user that ships with the Ubuntu base image.
USER ubuntu
EXPOSE 9966

# Healthy when /actuator/health says UP. With security on, every endpoint needs a
# login, so a 401 also counts as "the app is up and answering".
HEALTHCHECK --interval=5s --timeout=3s --start-period=60s --retries=24 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/9966 \
    && printf "GET /petclinic/actuator/health HTTP/1.0\r\nHost: localhost\r\n\r\n" >&3 \
    && grep -qE "\"UP\"|HTTP/1.1 401" <&3'

# The H2 database is in memory, so every new container starts from the seed data.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
