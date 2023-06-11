import { request } from "./config";
import { SIZE } from "../constants";

// 上传文件
export function uploadRequest(formData, onUploadProgress, signal) {
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
export const mergeRequest = async (fileName) => {
  await request({
    url: "upload/merge",
    headers: {
      "content-type": "application/json",
    },
    data: JSON.stringify({
      fileName,
      size: SIZE,
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
