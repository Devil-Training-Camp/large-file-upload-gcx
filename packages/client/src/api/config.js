import axios from "axios";
import { BASE_URL } from "../constants";

// axios的实例及拦截器配置
const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// axiosInstance.interceptors.response.use(
//   (res) => {
//     return res.data;
//   },
//   (err) => {
//     console.log(err, "网络错误");
//   }
// );

export { axiosInstance };
