package com.ssafy.etch.portfolio.service;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.ssafy.etch.global.exception.CustomException;
import com.ssafy.etch.global.exception.ErrorCode;
import com.ssafy.etch.member.entity.MemberEntity;
import com.ssafy.etch.member.repository.MemberRepository;
import com.ssafy.etch.portfolio.dto.*;
import com.ssafy.etch.portfolio.entity.PortfolioEntity;
import com.ssafy.etch.portfolio.entity.PortfolioProjectEntity;
import com.ssafy.etch.portfolio.repository.PortfolioProjectRepository;
import com.ssafy.etch.portfolio.repository.PortfolioRepository;
import com.ssafy.etch.project.dto.ProjectDTO;
import com.ssafy.etch.project.entity.ProjectEntity;
import com.ssafy.etch.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioServiceImpl implements PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final ProjectRepository projectRepository;
    private final PortfolioProjectRepository portfolioProjectRepository;
    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public List<PortfolioListResponseDTO> getPortfolioList(Long memberId) {

        memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return portfolioRepository.findAllByMember_IdAndIsDeletedIsFalse(memberId)
                .stream()
                .map(PortfolioEntity::toPortfolioDTO)
                .map(PortfolioListResponseDTO::from)
                .toList();
    }

    @Override
    @Transactional
    public void savePortfolio(Long memberId, PortfolioRequestDTO portfolioRequestDTO) {
        MemberEntity memberEntity = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String techList = techListToString(portfolioRequestDTO);

        PortfolioDTO portfolioDTO = portfolioRequestDTO
                .toPortfolioDTO(techList)
                .toBuilder()
                .member(memberEntity)
                .createdAt(LocalDate.now())
                .build();

        PortfolioEntity savedPortfolio = portfolioRepository.save(PortfolioEntity.from(portfolioDTO));
        List<Long> projectIds = portfolioRequestDTO.getProjectIds();
        List<PortfolioProjectEntity> savedEntities = getSavedEntities(savedPortfolio, projectIds);

        PortfolioEntity.updateProjectInfo(savedPortfolio, savedEntities);
    }

    @Override
    @Transactional
    public void updatePortfolio(Long memberId, Long portfolioId, PortfolioRequestDTO portfolioRequestDTO) {
        memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        PortfolioEntity portfolioEntity = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        PortfolioDTO portfolio = portfolioEntity.toPortfolioDTO();
        if (!portfolio.getMember().getId().equals(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        if (portfolio.isDeleted()) {
            throw new CustomException(ErrorCode.CONTENT_DELETED);
        }

        portfolioEntity.clear();
        portfolioProjectRepository.deleteByPortfolioId(portfolioId);

        List<Long> projectIds = portfolioRequestDTO.getProjectIds();
        List<PortfolioProjectEntity> savedEntities = getSavedEntities(portfolioEntity, projectIds);

        String techList = techListToString(portfolioRequestDTO);
        portfolioEntity.updateAll(portfolioRequestDTO, techList, savedEntities);
    }

    @Override
    @Transactional
    public void deletePortfolio(Long memberId, Long portfolioId) {
        memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        PortfolioEntity portfolioEntity =portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        if (!portfolioEntity.toPortfolioDTO().getMember().toMemberDTO().getId().equals(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        portfolioEntity.updateStatus();
    }

    @Override
    @Transactional(readOnly = true)
    public PortfolioDetailResponseDTO getPortfolioDetail(Long memberId, Long portfolioId) {
        memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        PortfolioEntity portfolioEntity = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        if(portfolioEntity.toPortfolioDTO().isDeleted()) {
            throw new CustomException(ErrorCode.CONTENT_DELETED);
        }
        if (!portfolioEntity.toPortfolioDTO().getMember().toMemberDTO().getId().equals(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        PortfolioDTO portfolioDTO = portfolioEntity.toPortfolioDTO();

        return PortfolioDetailResponseDTO.from(portfolioDTO, stringToTechList(portfolioDTO.getTechList()));
    }

    private List<PortfolioProjectEntity> getSavedEntities(PortfolioEntity portfolioEntity, List<Long> projectIds) {
        if (projectIds == null) {
            return Collections.emptyList();
        }
        List<PortfolioProjectEntity> savedEntities = new ArrayList<>();

        for (Long projectId : projectIds) {
            ProjectEntity projectEntity = projectRepository.findById(projectId).orElseThrow(()-> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

            if (Boolean.TRUE.equals(projectEntity.getIsDeleted())) {
                throw new CustomException(ErrorCode.CONTENT_NOT_FOUND);
            }
            if (!projectEntity.getMember().getId().equals(portfolioEntity.toPortfolioDTO().getMember().getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }

            PortfolioProjectEntity entity = PortfolioProjectEntity.builder()
                    .portfolio(portfolioEntity)
                    .project(projectEntity)
                    .build();
            PortfolioProjectEntity saved = portfolioProjectRepository.save(entity);
            savedEntities.add(saved);
        }
        return savedEntities;
    }

    private String techListToString(PortfolioRequestDTO dto) {
        List<String> list = dto.getTechList();
        if (list == null) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JacksonException e) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
    }
    private List<String> stringToTechList(String techList) {
        if (techList == null || techList.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(techList, new TypeReference<List<String>>() {});
        } catch (JacksonException e) {
            throw new CustomException(ErrorCode.INVALID_INPUT); // 입력 문제로 처리
        }
    }


    @Override
    @Transactional(readOnly = true)
    public String getPortfolioAsMarkdown(Long memberId, Long portfolioId) {
        memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        PortfolioEntity portfolioEntity = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTENT_NOT_FOUND));

        if (portfolioEntity.toPortfolioDTO().isDeleted()) {
            throw new CustomException(ErrorCode.CONTENT_DELETED);
        }
        if (!portfolioEntity.toPortfolioDTO().getMember().getId().equals(memberId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        PortfolioDTO portfolio = portfolioEntity.toPortfolioDTO();

        return generatePortfolioMarkdown(portfolio);
    }


    private <T> List<T> parseDelimitedString(String source, Function<String[], T> mapper) {
        if (source == null || source.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(source.split("\\|"))
                .map(segment -> mapper.apply(segment.split("\\^", -1)))
                .toList();
    }

    private String getValue(String[] info, int index) {
        return info.length > index && !info[index].isBlank() ? info[index] : null;
    }

    private LocalDate parseDate(String[] info, int index) {
        return info.length > index && !info[index].isBlank()
                ? LocalDate.parse(info[index])
                : null;
    }

    public String generatePortfolioMarkdown(PortfolioDTO portfolio) {
        MarkdownTemplateEngine engine = new MarkdownTemplateEngine();
        String template = engine.loadTemplate("/markdown/portfolioTemplate.md");

        Map<String, Object> data = new HashMap<>();
        // 기본 필드
        data.put("name", Optional.ofNullable(portfolio.getName()).orElse("미입력"));
        data.put("introduce", Optional.ofNullable(portfolio.getIntroduce()).orElse("미입력"));
        data.put("email", Optional.ofNullable(portfolio.getEmail()).orElse("미입력"));
        data.put("phoneNumber", Optional.ofNullable(portfolio.getPhoneNumber()).orElse("미입력"));
        data.put("githubUrl", Optional.ofNullable(portfolio.getGithubUrl()).orElse("미입력"));
        data.put("linkedInUrl", Optional.ofNullable(portfolio.getLinkedInUrl()).orElse("미입력"));
        data.put("blogUrl", Optional.ofNullable(portfolio.getBlogUrl()).orElse("미입력"));

        // 기술 스택
        List<String> techList = stringToTechList(portfolio.getTechList());
        data.put("techList", techList.isEmpty()
                ? "- 미입력"
                : techList.stream().map(t -> "- " + t).collect(Collectors.joining("\n")));

        // 프로젝트
        List<Map<String, Object>> projects = Optional.ofNullable(portfolio.getProject())
                .orElse(Collections.emptyList())
                .stream()
                .map(pp -> {
                    ProjectDTO p = pp.getProject().toProjectDTO();
                    Map<String, Object> pm = new HashMap<>();
                    pm.put("title", Optional.ofNullable(p.getTitle()).orElse("미입력"));
                    pm.put("content", Optional.ofNullable(p.getContent()).orElse("미입력"));
                    pm.put("thumbnailUrl", Optional.ofNullable(p.getThumbnailUrl()).orElse("미입력"));
                    pm.put("youtubeUrl", Optional.ofNullable(p.getYoutubeUrl()).orElse("미입력"));
                    pm.put("githubUrl", Optional.ofNullable(p.getGithubUrl()).orElse("미입력"));
                    pm.put("category",p.getProjectCategory());
                    pm.put("techList", p.getProjectTechs().stream()
                            .map(tech -> tech.getTechCode().getCodeName())
                            .collect(Collectors.joining(", ")));
                    
                    return pm;
                })
                .toList();

        data.put("project", projects); // 빈 리스트면 반복문 자체가 안 돌도록 함

        // 학력 및 활동
        List<Map<String, Object>> eduList = parseDelimitedString(
                portfolio.getEducation(),
                info -> Map.of(
                        "name", Optional.ofNullable(getValue(info, 0)).orElse("미입력"),
                        "description", Optional.ofNullable(getValue(info, 1)).orElse("미입력"),
                        "startDate", Optional.ofNullable(String.valueOf(parseDate(info, 2))).orElse("미입력"),
                        "endDate", Optional.ofNullable(String.valueOf(parseDate(info, 3))).orElse("미입력")
                )
        );
        data.put("eduAndAct", eduList.isEmpty() ? null : eduList);

        // 자격증 및 어학
        List<Map<String, Object>> certList = parseDelimitedString(
                portfolio.getLanguage(),
                info -> Map.of(
                        "name", Optional.ofNullable(getValue(info, 0)).orElse("미입력"),
                        "date", Optional.ofNullable(String.valueOf(parseDate(info, 1))).orElse("미입력"),
                        "certificateIssuer", Optional.ofNullable(getValue(info, 2)).orElse("미입력")
                )
        );
        data.put("certAndLang", certList.isEmpty() ? null : certList);

        return engine.render(template, data);
    }
}
