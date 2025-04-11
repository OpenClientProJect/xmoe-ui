import request from '@/utils/request.js'

// 获取番剧列表
export const getDramaListService = () =>{
    return request.get('/drama/dramaList')
}

// 获取番剧详情
export const getDramaDetailService = (id) =>{
    return request.get(`/drama/dramaInfo?vodId=` + id)
}