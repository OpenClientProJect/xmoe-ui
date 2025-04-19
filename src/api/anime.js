import request from "@/utils/request.js";

//新番列表
export const getDramaListService = () => {
    return request({
        url: '/vod/list',
        method: 'get',
        params: {
            page: '1',
            limit: '100',
            type: 'aqy',
        }
    })
}