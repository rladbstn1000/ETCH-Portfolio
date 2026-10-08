package com.ssafy.etch.global.config;

import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

import java.util.List;

@Configuration
public class SwaggerConfig {

	@Bean
	public OpenAPI openAPI() {
		Info info = new Info()
			.title("ETCH Business Server API")
			.version("v1.0.0")
			.description("프로젝트 API에 대한 명세서입니다.");

		//server url prefix!!!!!!
		Server server = new Server().url("/api/v1");

		return new OpenAPI()
			.info(info)
			.addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
				.servers(List.of(server))
			.components(new Components().addSecuritySchemes("bearerAuth",
				new SecurityScheme()
					.name("Authorization")
					.type(SecurityScheme.Type.HTTP)
					.scheme("bearer")
					.bearerFormat("JWT")
			));
	}

}
