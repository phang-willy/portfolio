package com.phangwilly.portfolio.model;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_stacks")
public class ProjectStack extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
    name = "id_project",
    nullable = false,
    foreignKey = @ForeignKey(name = "fk_project_stacks_project")
  )
  private Project project;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
    name = "id_stack",
    nullable = false,
    foreignKey = @ForeignKey(name = "fk_project_stacks_stack")
  )
  private Stack stack;

  protected ProjectStack() {
  }

  public ProjectStack(Project project, Stack stack) {
    this.project = project;
    this.stack = stack;
  }

  public Project getProject() {
    return project;
  }

  public Stack getStack() {
    return stack;
  }
}
