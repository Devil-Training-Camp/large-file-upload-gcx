import { BASE_URL } from "../constants";

const request = ({ url, method = "post", data, headers = {}, onProgress = (e) => e, signal }) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = onProgress;

    xhr.onreadystatechange = function () {
      // console.log(xhr.readyState);
    };
    xhr.open(method, `${BASE_URL}/${url}`);
    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });
    xhr.send(data);

    // 请求成功之后的回调
    xhr.onload = (e) => {
      resolve({ data: e.target.response ? JSON.parse(e.target.response) : null });
    };
  });
};

export { request };
