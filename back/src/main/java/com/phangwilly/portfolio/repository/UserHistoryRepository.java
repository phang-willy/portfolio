package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.UserHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserHistoryRepository extends JpaRepository<UserHistory, UUID> {

  List<UserHistory> findByUser_IdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(UUID userId);
}
