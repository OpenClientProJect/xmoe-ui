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

/**
 * 添加追番、播放记录
 */
export const addHistoryService = (params) => {
    return request({
        url: 'sk-api/user/ulog_add',
        method: 'post',
        data: params
    })
}

/**
 * 获取追番、播放记录
 */
export const getHistoryService = (params) => {
    return request({
        url: 'sk-api/user/ulog_count',
        method: 'get',
        params: params
    })
}

/**
 * 获取追番、播放记录列表
 */
export const getHistoryListService = (params) => {
    return request({
        url: 'sk-api/user/ulog_list',
        method: 'get',
        params: params
    })
}