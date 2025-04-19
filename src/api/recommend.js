import request from "@/utils/request.js";

//轮播图
export const getBannerListService = () => {
    return request({
        url: '/vod/list',
        method: 'get',
        params: {
            page: '1',
            limit: '6',
            type: 'banner'
        }
    })
}