import { request } from "./config";

// 上传文件
export function uploadRequest(formData, onUploadProgress, signal) {
  console.log(signal);
  return request({
    url: "upload",
    data: formData,
    onProgress: (e) => {
      onUploadProgress?.(parseInt(String((e.loaded / e.total) * 100)));
    },
    signal,
  });
}

// 通知服务端合并分片文件
export const mergeRequest = async (fileName, fileHash, CHUNK_SIZE) => {
  await request({
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
  const res = await request({
    url: "upload/verify",
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
  const result = await request({
    method: "post",
    url: "upload/can_continue",
    data: JSON.stringify(data),
  });
  return result.data;
}
