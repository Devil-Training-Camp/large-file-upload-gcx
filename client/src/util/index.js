import { SIZE } from "../constants";
import { uploadRequest, mergeRequest } from "../api/request";

// 生成切片的大小
function createFileChunk(file, size = SIZE) {
  const fileChunkList = [];
  let cur = 0;
  while (cur < file.size) {
    fileChunkList.push({ file: file.slice(cur, cur + size) });
    cur += size;
  }

  return fileChunkList;
}

// 生成文件 hash 及切片 hash 值
const calculateHash = (fileChunks, setProgressValue) => {
  return new Promise((resolve) => {
    let result = { fileHash: "", chunkHashs: [] };
    let worker = new Worker(new URL("./worker.js", import.meta.url));
    // 添加 worker 属性
    console.log(fileChunks);
    worker.postMessage({ fileChunks });
    worker.onmessage = (e) => {
      const { percentage, fileHash, chunkHash } = e.data;
      setProgressValue && setProgressValue(percentage);
      if (fileHash) {
        result.fileHash = fileHash;
        resolve(result);
      } else {
        result.chunkHashs.push(chunkHash);
      }
    };
  });
};

const uploadChunks = async ({ fileName, fileHash, chunkHashs, hashToChunkMap, onUploadProgress }) => {
  const requestList = chunkHashs
    .map((chunkHash) => {
      const { chunk } = hashToChunkMap.get(chunkHash);
      const formData = new FormData();
      formData.append("chunk", chunk["file"]);
      formData.append("fileHash", fileHash);
      formData.append("chunkHash", chunkHash);
      formData.append("fileName", fileName);
      return { formData, chunkHash };
    })
    .map(({ formData, chunkHash }, index) => {
      return new Promise(async (resolve, reject) => {
        try {
          await uploadRequest(formData, onUploadProgress);
        } catch (error) {
          console.log("uploadRequst function fail:", error);
          reject();
        }

        resolve();
      });
    });

  await Promise.all(requestList);

  // 前端发送额外的合并请求，服务端接受到请求时合并切片
  await mergeRequest(fileName);
};

export { createFileChunk, calculateHash, uploadChunks };
