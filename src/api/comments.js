import request from "@/utils/request.js";

/**
 * 获取评论数据
 */
export const getCommentsService = (vodId) => {
  return request({
    url: "/vod/get_pinglun",
    method: "get",
    params:{
      vodId: vodId,
      type: 'comment_time'
    }
  });
};