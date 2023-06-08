const request = ({ url, method = "post", data, headers = {}, onProgress = (e) => e, requestList }) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = onProgress;
    xhr.open(method, url);
    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });
    xhr.send(data);

    xhr.onload = (e) => {
      resolve({ data: e.target.response });
    };
  });
};

export { request };
