import { request } from "./config";
import { BASE_URL, SIZE } from "../constants";

export function uploadRequest(formData, onUploadProgress) {
  return request({
    url: `${BASE_URL}/upload`,
    data: formData,
    onProgress: (e) => {
      onUploadProgress?.(parseInt(String((e.loaded / e.total) * 100)));
    },
  });
}

export const mergeRequest = async (fileName) => {
  await request({
    url: `${BASE_URL}/upload/merge`,
    headers: {
      "content-type": "application/json",
    },
    data: JSON.stringify({
      fileName,
      size: SIZE,
    }),
  });
};
