import request from "@/utils/request.js";

/**
 * 搜索
 */
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