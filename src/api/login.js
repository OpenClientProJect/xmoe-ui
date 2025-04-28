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
    url: "/register",
    method: "post",
    data: params,
  });
};