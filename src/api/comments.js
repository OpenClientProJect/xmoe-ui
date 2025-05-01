import request from "@/utils/request.js";

/**
 * 获取评论数据
 */
export const getCommentsService = (vodId) => {
  return request({
    url: "/sk-api//vod/get_pinglun",
    method: "get",
    params:{
      vodId: vodId,
      type: 'comment_time'
    }
  });
};

/**
 * 发送评论
 */
export const sendCommentService = (params) => {
  return request({
    url: 'sk-api/vod/post_pinglun',
    method: 'post',
    data: params
  })
}