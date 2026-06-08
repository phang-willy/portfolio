package com.phangwilly.portfolio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PortfolioApiApplication {

  public static void main(String[] args) {
    SpringApplication.run(PortfolioApiApplication.class, args);
  }
}
