package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.model.UserPassword;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPasswordRepository extends JpaRepository<UserPassword, UUID> {

  Optional<UserPassword> findByUser(User user);
}
