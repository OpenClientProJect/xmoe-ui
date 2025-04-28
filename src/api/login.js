import request from "@/utils/request.js";

/**
 * 发送验证码
 */
export const sendCodeService = (params) => {
  return request({
    url: "/send_reg_email",
    method: "post",
    data: params,
  });
};

/**
 * 注册
 */
export const registerService = (params) => {
  return request({
    url: "/sk-api/user/add",
    method: "post",
    data: params,
  });
};

/**
 * 登录
 */
export const loginService = (params) => {
  return request({
    url: "/sk-api/user/login",
    method: "post",
    data: params,
  });
};