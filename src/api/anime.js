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
//排期表
export const getDramaScheduleService = () => {
    return request({
        url: '/vod/list',
        method: 'get',
        params: {
            page: '1',
            limit: '18',
            type: 'RiliDetail',
        }
    })
}