import request from "@/utils/request.js";
import {data} from "autoprefixer";

/**
 * 获取用户信息
 * @param {number} userId - 用户ID
 * @param {string} userName - 用户名
 */
export const getUserInfoService = (userId, userName) => {
    return request({
        url: 'sk-api/user/get_user_info',
        method: 'get',
        params: { 
            user_id: userId,
            user_name: userName
        }
    })
}