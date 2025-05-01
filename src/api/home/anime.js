import request from "@/utils/request.js";

//新番列表
export const getDramaListService = () => {
    return request({
        url: '/sk-api/vod/list',
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
        url: '/sk-api/vod/list',
        method: 'get',
        params: {
            page: '1',
            limit: '18',
            type: 'RiliDetail',
        }
    })
}
//轮播图
export const getBannerListService = () => {
    return request({
        url: '/sk-api/vod/list',
        method: 'get',
        params: {
            page: '1',
            limit: '6',
            type: 'banner'
        }
    })
}

//首页顶部菜单
export const getMenuListService = () => {               
    return request({
        url: '/sk-api/type/list',
        method: 'get',
    })
}

//获取子分类菜单
export const getSubMenuListService = (typeId) => {
    return request({
        url: '/sk-api/type/alltypeextend',
        method: 'get',
        params: {
            typeId: typeId
        }
    })
}
