package com.phangwilly.portfolio.config;

import com.phangwilly.portfolio.model.ServiceHealthKind;
import com.phangwilly.portfolio.model.ServiceHealthTarget;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.service-health")
public class ServiceHealthProperties {

  private static final Pattern POSTGRES_HOST = Pattern.compile("jdbc:postgresql://([^/?]+)");
  private static final Pattern COMPOSE_SERVICE = Pattern.compile("[A-Za-z0-9][A-Za-z0-9_.-]{0,63}");
  private static final int DEFAULT_TIMEOUT_MILLIS = 3000;
  private static final int DEFAULT_SERVER_PORT = 8000;
  private static final long DEFAULT_RESTART_PROBE_DELAY_MILLIS = 3000;
  private static final String DEFAULT_COMPOSE_PROJECT = "portfolio";
  private static final String DEFAULT_DOCKER_SOCKET = "/var/run/docker.sock";

  private int timeoutMillis = DEFAULT_TIMEOUT_MILLIS;
  private String siteUrl;
  private String adminBaseUrl;
  private String apiBaseUrl;
  private String frontProbeUrl;
  private String adminProbeUrl;
  private String adminerProbeUrl;
  private String adminerPublicUrl;
  private String mailWebProbeUrl;
  private String mailWebPublicUrl;
  private String smtpHost;
  private int smtpPort;
  private int serverPort = DEFAULT_SERVER_PORT;
  private String datasourceUrl;
  private Map<String, String> composeServicesByCode = Map.of();
  private String composeProject = DEFAULT_COMPOSE_PROJECT;
  private String dockerSocket = DEFAULT_DOCKER_SOCKET;
  private long restartProbeDelayMillis = DEFAULT_RESTART_PROBE_DELAY_MILLIS;

  public int getTimeoutMillis() {
    return timeoutMillis < 200 ? DEFAULT_TIMEOUT_MILLIS : timeoutMillis;
  }

  public void setTimeoutMillis(int timeoutMillis) {
    this.timeoutMillis = timeoutMillis;
  }

  public void setSiteUrl(String siteUrl) {
    this.siteUrl = siteUrl;
  }

  public void setAdminBaseUrl(String adminBaseUrl) {
    this.adminBaseUrl = adminBaseUrl;
  }

  public void setApiBaseUrl(String apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  public void setFrontProbeUrl(String frontProbeUrl) {
    this.frontProbeUrl = frontProbeUrl;
  }

  public void setAdminProbeUrl(String adminProbeUrl) {
    this.adminProbeUrl = adminProbeUrl;
  }

  public void setAdminerProbeUrl(String adminerProbeUrl) {
    this.adminerProbeUrl = adminerProbeUrl;
  }

  public void setAdminerPublicUrl(String adminerPublicUrl) {
    this.adminerPublicUrl = adminerPublicUrl;
  }

  public void setMailWebProbeUrl(String mailWebProbeUrl) {
    this.mailWebProbeUrl = mailWebProbeUrl;
  }

  public void setMailWebPublicUrl(String mailWebPublicUrl) {
    this.mailWebPublicUrl = mailWebPublicUrl;
  }

  public void setSmtpHost(String smtpHost) {
    this.smtpHost = smtpHost;
  }

  public void setSmtpPort(int smtpPort) {
    this.smtpPort = smtpPort;
  }

  public void setServerPort(int serverPort) {
    this.serverPort = serverPort;
  }

  public void setDatasourceUrl(String datasourceUrl) {
    this.datasourceUrl = datasourceUrl;
  }

  public void setRestartServices(String restartServices) {
    this.composeServicesByCode = parseRestartServices(restartServices);
  }

  public void setComposeProject(String composeProject) {
    this.composeProject = composeProject;
  }

  public void setDockerSocket(String dockerSocket) {
    this.dockerSocket = dockerSocket;
  }

  public void setRestartProbeDelayMillis(long restartProbeDelayMillis) {
    this.restartProbeDelayMillis = restartProbeDelayMillis;
  }

  public boolean restartable(String code) {
    return composeService(code) != null;
  }

  public String composeService(String code) {
    if (code == null) {
      return null;
    }
    return composeServicesByCode.get(code);
  }

  public String composeProject() {
    if (composeProject == null || composeProject.isBlank()) {
      return DEFAULT_COMPOSE_PROJECT;
    }
    return composeProject.trim();
  }

  public String dockerSocket() {
    if (dockerSocket == null || dockerSocket.isBlank()) {
      return DEFAULT_DOCKER_SOCKET;
    }
    return dockerSocket.trim();
  }

  public long restartProbeDelayMillis() {
    return Math.max(0, restartProbeDelayMillis);
  }

  public List<ServiceHealthTarget> targets() {
    List<ServiceHealthTarget> targets = new ArrayList<>();
    addHttp(targets, "front", "Front", siteUrl, frontProbeUrl);
    addHttp(targets, "admin", "Admin", adminBaseUrl, adminProbeUrl);
    String localApi = "http://127.0.0.1:" + resolvedServerPort() + "/api/health";
    targets.add(new ServiceHealthTarget(
      "api",
      "API",
      firstText(apiBaseUrl, localApi),
      ServiceHealthKind.HTTP,
      localApi,
      null,
      0
    ));
    String postgres = postgresEndpoint(datasourceUrl);
    if (postgres != null) {
      targets.add(new ServiceHealthTarget(
        "postgres",
        "PostgreSQL",
        postgres,
        ServiceHealthKind.JDBC,
        null,
        null,
        0
      ));
    }
    if (firstText(smtpHost, null) != null && smtpPort > 0 && smtpPort <= 65535) {
      String host = smtpHost.trim();
      targets.add(new ServiceHealthTarget(
        "smtp",
        "SMTP",
        host + ":" + smtpPort,
        ServiceHealthKind.TCP,
        null,
        host,
        smtpPort
      ));
    }
    addHttp(targets, "adminer", "Adminer", adminerPublicUrl, adminerProbeUrl);
    addHttp(targets, "mail", "Mail", mailWebPublicUrl, mailWebProbeUrl);
    return List.copyOf(targets);
  }

  static String postgresEndpoint(String jdbcUrl) {
    if (jdbcUrl == null || jdbcUrl.isBlank()) {
      return null;
    }
    Matcher matcher = POSTGRES_HOST.matcher(jdbcUrl.trim());
    if (matcher.find()) {
      return matcher.group(1);
    }
    return jdbcUrl.trim();
  }

  private int resolvedServerPort() {
    return serverPort > 0 && serverPort <= 65535 ? serverPort : DEFAULT_SERVER_PORT;
  }

  private static void addHttp(
    List<ServiceHealthTarget> targets,
    String code,
    String service,
    String displayUrl,
    String probeUrl
  ) {
    String probe = firstText(probeUrl, displayUrl);
    if (probe == null) {
      return;
    }
    targets.add(new ServiceHealthTarget(
      code,
      service,
      firstText(displayUrl, probe),
      ServiceHealthKind.HTTP,
      probe,
      null,
      0
    ));
  }

  private static Map<String, String> parseRestartServices(String raw) {
    if (raw == null || raw.isBlank()) {
      return Map.of();
    }
    Map<String, String> parsed = new LinkedHashMap<>();
    for (String part : raw.split(",")) {
      String[] pair = part.split("=", 2);
      if (pair.length != 2) {
        continue;
      }
      String code = pair[0].trim();
      String service = pair[1].trim();
      if (!code.isEmpty() && COMPOSE_SERVICE.matcher(service).matches()) {
        parsed.put(code, service);
      }
    }
    return Map.copyOf(parsed);
  }

  private static String firstText(String preferred, String fallback) {
    if (preferred != null && !preferred.isBlank()) {
      return preferred.trim();
    }
    if (fallback != null && !fallback.isBlank()) {
      return fallback.trim();
    }
    return null;
  }
}
