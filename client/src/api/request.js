import { axiosInstance } from "./config";

// 上传文件
export function uploadRequest(formData, signal) {
  return axiosInstance({
    method: "post",
    url: "upload",
    data: formData,
    signal,
  });
}

// 通知服务端合并分片文件
export const mergeRequest = async (fileName, fileHash, CHUNK_SIZE) => {
  await axiosInstance({
    method: "post",
    url: "upload/merge",
    headers: {
      "content-type": "application/json",
    },
    data: JSON.stringify({
      fileName,
      fileHash,
      chunk_size: CHUNK_SIZE,
    }),
  });
};

// 验证是否需要上传文件（文件秒传）
export async function verifyUpload(fileName, fileHash) {
  const res = await axiosInstance({
    url: "upload/verify",
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    data: JSON.stringify({
      fileName,
      fileHash,
    }),
  });
  return res.data.instantTransmission;
}

// 继续上传
export async function getCanContinue(data) {
  const result = await axiosInstance({
    method: "post",
    url: "upload/can_continue",
    data: JSON.stringify(data),
  });
  return result.data;
}
