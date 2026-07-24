package com.procurex.identityservice.repository;

import com.procurex.identityservice.entity.AccountStatus;
import com.procurex.identityservice.entity.RoleName;
import com.procurex.identityservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRoleRoleNameAndAccountStatus(RoleName roleName, AccountStatus accountStatus);
}
