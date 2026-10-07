package com.enterprise.supply.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private RoleInterceptor roleInterceptor;

    /**
     * 注册接口级角色校验拦截器。
     * 规则集中在 RoleInterceptor 里，这里只负责把它挂到 /api/** 上。
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(roleInterceptor).addPathPatterns("/api/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 映射上传目录为静态资源
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:./uploads/");
                
        // 映射图片目录为静态资源
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:./src/main/resources/static/images/");
    }
}