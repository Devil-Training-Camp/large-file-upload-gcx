import JSZip from "jszip";
import { CHUNK_SIZE } from "../constants";
import { uploadRequest, mergeRequest, verifyUpload } from "../api/request";

// 压缩选择的文件
const generateZip = async (file) => {
  var zip = new JSZip();
  zip.file(file.name, file, { date: new Date(file.lastModifiedDate) });
  const content = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9, // level: 9，意味着JSZip将使用最高压缩级别
    },
  });
  // saveAs(content, 'temp.zip'); // FileSaver库 此处可测试解压文件
  return content;
};

// 生成切片的大小
function createFileChunk(file, size = CHUNK_SIZE) {
  const fileChunkList = [];
  let cur = 0;
  while (cur < file.size) {
    fileChunkList.push({ file: file.slice(cur, cur + size) });
    cur += size;
  }

  return fileChunkList;
}

// 生成文件 hash 及切片 hash 值
const calculateHash = ({ fileChunks, onProgress }) => {
  return new Promise((resolve) => {
    let result = { fileHash: "", chunkHashs: [] };
    let worker = new Worker(new URL("./worker.js", import.meta.url));
    // 添加 worker 属性
    worker.postMessage({ fileChunks });
    worker.onmessage = (e) => {
      const { percentage, fileHash, chunkHash } = e.data;
      onProgress?.(percentage);
      if (fileHash) {
        result.fileHash = fileHash;
        resolve(result);
      } else {
        result.chunkHashs.push(chunkHash);
      }
    };
  });
};

const uploadChunks = async ({
  fileName,
  fileHash,
  chunkHashs,
  hashToChunkMap,
  onUploadProgress,
  onUploadQuickProcess,
  controllerRef,
}) => {
  // 判断是否妙传 -- 这里判断的是上传文件名和 hash 值，而非单个分片文件
  const { isInstantTransmission } = await verifyUpload(fileName, fileHash);
  if (isInstantTransmission) {
    onUploadQuickProcess?.();
    alert("skip upload: file upload success");
    return;
  }
  const requestList = chunkHashs
    .map((chunkHash) => {
      const { chunk, index } = hashToChunkMap.get(chunkHash);
      const formData = new FormData();
      formData.append("chunk", chunk["file"]);
      formData.append("fileHash", fileHash);
      formData.append("chunkHash", `${chunkHash}-${index}`);
      // formData.append("fileName", fileName);
      return { formData, chunkHash };
    })
    .map(({ formData }) => {
      return new Promise(async (resolve, reject) => {
        try {
          await uploadRequest(formData, controllerRef.current.signal);
        } catch (error) {
          //!!! 这里有一个不理解的地方是，点击暂停后 promise 报一个错误，这里已经捕获到了，在外层Promise 那里为什么还是报错导致页面报错
          console.log("uploadRequst fail:", error);
          controllerRef.current = new AbortController();
          reject();
          return;
        }
        onUploadProgress?.();
        resolve();
      });
    });
  //!!! 点击暂停，取消请求时，Promise.all 返回 reject 导致报错，这里优化一下
  const chunkRequestStatusList = await Promise.allSettled(requestList);

  // *** 判断切片是否上传完毕
  const isFinish = chunkRequestStatusList.every((item) => item.status === "fulfilled");
  if (isFinish) {
    // 前端发送额外的合并请求，服务端接受到请求时合并切片
    const merageResult = await mergeRequest(fileName, fileHash, CHUNK_SIZE);
    merageResult?.message && alert(merageResult?.message);
  }
};

export { createFileChunk, calculateHash, uploadChunks, generateZip };
