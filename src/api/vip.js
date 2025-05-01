import request from "@/utils/request.js";

/**
 * 充值会员
 */
export const rechargeService = (params) => {
  return request({
    url: "sk-api/user/open_vip",
    method: "post",
    data: params,
  });
}