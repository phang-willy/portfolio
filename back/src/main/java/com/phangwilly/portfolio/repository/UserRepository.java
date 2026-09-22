package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

  boolean existsByEmailIgnoreCase(String email);

  boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);

  Optional<User> findByEmailIgnoreCase(String email);
}
