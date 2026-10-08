package com.ssafy.etch.portfolio.entity;

import com.ssafy.etch.project.entity.ProjectEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "portfolio_project",
        uniqueConstraints = @UniqueConstraint(columnNames = {"portfolio_id", "project_id"})
)
public class PortfolioProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private PortfolioEntity portfolio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ProjectEntity project;

    public ProjectEntity getProject() {
        return project;
    }

}
