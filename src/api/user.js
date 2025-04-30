import request from "@/utils/request.js";
import {data} from "autoprefixer";

/**
 * 获取用户信息
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

/**
 * 更新用户信息
 */
export const updateUserInfoService = (params) => {
    return request({
        url: 'sk-api/user/user_settings',
        method: 'post',
        data: params
    })
}