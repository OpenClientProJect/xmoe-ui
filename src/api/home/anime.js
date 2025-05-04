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
export const getDramaScheduleService = (typeKey) => {
    return request({
        url: '/sk-api/vod/list',
        method: 'get',
        params: {
            typeKey: typeKey,
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
//消息中心
export const getMessageListService = () => {
    return request({
        url: 'sk-api/topic/art_list',
        method: 'get',
    })
}
//搜索
export const searchService = (params) => {
    // 处理参数：支持字符串或对象形式的参数
    let keyword, typeId;

    if (typeof params === 'string') {
        keyword = params;
        typeId = -1; // 默认值
    } else {
        keyword = params.keyword;
        typeId = params.typeId !== undefined ? params.typeId : -1;
    }

    return request({
        url: "/sk-api/search/pages",
        method: "get",
        params: {
            keyword: keyword,
            page: 1,
            limit: 10,
            typeId: typeId,
        },
    });
};

//获取留言求片
export const getMessageService = (user_id) => {
    return request.get('sk-api/user/getleavemsg?user_id=' + user_id )
}

//发送留言
export const sendMessageService = (params) => {
    return request({
        url: 'sk-api/user/leavemsg',
        method: 'post',
        data: params
    })
}

//排行榜
export const getRankListService = (typeId) => {
    return request({
        url: '/sk-api/vod/list',
        method: 'get',
        params: {
            typeId: typeId,
            page: 1,
            limit: 20,
            type: 'bangdandetail'
        }
    })
}