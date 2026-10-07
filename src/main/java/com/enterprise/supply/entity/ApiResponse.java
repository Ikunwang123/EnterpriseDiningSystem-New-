package com.enterprise.supply.entity;


public class ApiResponse {
    private int code;
    private String msg;
    private Object data;

    // 构造函数
    public ApiResponse(int code, String msg, Object data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    // 静态方法创建成功响应
    public static ApiResponse success(Object data) {
        return new ApiResponse(200, "success", data);
    }

    // 静态方法创建失败响应
    public static ApiResponse error(String msg) {
        return new ApiResponse(500, msg, null);
    }

    // getter 和 setter 方法
    public int getCode() { return code; }
    public void setCode(int code) { this.code = code; }
    public String getMsg() { return msg; }
    public void setMsg(String msg) { this.msg = msg; }
    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }
}

