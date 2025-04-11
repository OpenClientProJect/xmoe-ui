import request from '@/utils/request.js'

export const getDramaListService = () =>{
    return request.get('/drama/dramaList')
}