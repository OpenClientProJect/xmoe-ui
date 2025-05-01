import axios from "axios";
import {processVideoSourceId} from "@/utils/rc4Utils.js";

/**
 * 获取弹幕
 */
export const getDanmakuService = (vodId) => {

    const processedUrl = processVideoSourceId(vodId);
    return axios({
        url: "https://1301617005-issnpehylz.ap-guangzhou.tencentscf.com",
        method: "get",
        params: {
            ac: "dm",
            id: processedUrl,
        },
    });
};