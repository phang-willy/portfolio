package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.ServiceHealthProperties;
import java.nio.file.Path;
import org.springframework.stereotype.Component;

@Component
public class DockerComposeContainerControl implements ComposeContainerControl {

  private final ServiceHealthProperties properties;

  public DockerComposeContainerControl(ServiceHealthProperties properties) {
    this.properties = properties;
  }

  @Override
  public void restart(String project, String service) {
    new DockerEngineClient(Path.of(properties.dockerSocket())).restartComposeService(project, service);
  }
}
