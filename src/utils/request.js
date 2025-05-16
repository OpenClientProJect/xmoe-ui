//定制请求的实例

//导入axios  npm install axios
import axios from 'axios';
import {ElMessage} from "element-plus";
//定义一个变量,记录公共的前缀  ,  baseURL
const baseURL = '/sk-api';
const instance = axios.create({
    baseURL,
    timeout: 20000 // 设置15秒超时时间
})
//添加请求拦截器
// instance.interceptors.request.use(
//     config => {
//         //请求前回调
//         //添加token
//         const tokenStore = useTokenStore();
//         if (tokenStore.token) {
//             config.headers.Authorization = tokenStore.token;
//         }
//         return config;
//     },
//     (err) => {
//         //请求失败回调
//         return Promise.reject(err);//异步的状态转化成失败的状态
//     }
// )

//添加响应拦截器
instance.interceptors.response.use(
    result => {
        //判断业务状态码
        if (result.data.code === 200) {
            //返回数据
            return result.data;
        }

        // 处理验证码发送成功的情况（code为1且包含验证码发送成功的消息）
        if (result.data.code === 1 &&
            (result.data.msg === '验证码发送成功' ||
                result.data.message === '验证码发送成功' ||
                result.config.url.includes('/send_reg_email'))) {
            ElMessage.success('验证码发送成功，请查收邮箱');
            return result.data;
        }

        //提示错误信息
        ElMessage.error(result.data.message ? result.data.message : (result.data.msg || '服务异常'))
        //异步操作状态转换为失败
        return Promise.reject(result.data);
    },
    err => {
        if (err.response) {
            if (err.response.status === 429) {
                ElMessage.error('请求过于频繁，请稍后再试')
            } else {
                ElMessage.error('服务异常，请稍后再试')
            }
        } else {
            ElMessage.error('请求超时，请稍后再试')
        }
        return Promise.reject(err);//异步的状态转化成失败的状态
    }
)

export default instance;
