package com.phangwilly.portfolio.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

  private static final String UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
  private static final String UNAUTHENTICATED_MESSAGE = "Authentication is required";
  private static final String FORBIDDEN_CODE = "FORBIDDEN";
  private static final String FORBIDDEN_MESSAGE = "Access denied";

  @Bean
  public SecurityFilterChain securityFilterChain(
    HttpSecurity http,
    JwtSessionAuthenticationFilter jwtSessionAuthenticationFilter,
    SecurityErrorWriter securityErrorWriter
  ) throws Exception {
    return http
      .csrf(AbstractHttpConfigurer::disable)
      .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .formLogin(AbstractHttpConfigurer::disable)
      .httpBasic(AbstractHttpConfigurer::disable)
      .exceptionHandling(exceptions -> exceptions
        .authenticationEntryPoint((request, response, exception) -> securityErrorWriter.write(
          response,
          org.springframework.http.HttpStatus.UNAUTHORIZED,
          UNAUTHENTICATED_CODE,
          UNAUTHENTICATED_MESSAGE
        ))
        .accessDeniedHandler((request, response, exception) -> securityErrorWriter.write(
          response,
          org.springframework.http.HttpStatus.FORBIDDEN,
          FORBIDDEN_CODE,
          FORBIDDEN_MESSAGE
        )))
      .authorizeHttpRequests(authorize -> authorize
        .requestMatchers("/api/auth/**", "/api/health", "/api/project", "/actuator/**", "/admin/**")
        .permitAll()
        .requestMatchers("/api/account/**")
        .authenticated()
        .requestMatchers("/api/admin/**")
        .hasRole("ADMIN")
        .anyRequest()
        .permitAll())
      .addFilterBefore(jwtSessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
      .build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
