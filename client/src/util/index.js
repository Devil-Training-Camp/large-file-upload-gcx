import JSZip from "jszip";
import { SIZE } from "../constants";
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

const uploadChunks = async ({ fileName, fileHash, chunkHashs, hashToChunkMap, onUploadProgress, controllerRef }) => {
  // 判断是否妙传 -- 这里判断的是上传文件名和 hash 值，而非单个分片文件
  const isInstantTransmission = await verifyUpload(fileName, fileHash);
  console.log(isInstantTransmission);
  if (isInstantTransmission) {
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
      formData.append("fileName", fileName);
      return { formData, chunkHash };
    })
    .map(({ formData, chunkHash }, index) => {
      return new Promise(async (resolve, reject) => {
        try {
          await uploadRequest(formData, onUploadProgress, controllerRef.current.signal);
        } catch (error) {
          console.log("uploadRequst function fail:", error);
          controllerRef.current = new AbortController();
          reject();
          return;
        }

        resolve();
      });
    });

  await Promise.all(requestList);

  // 前端发送额外的合并请求，服务端接受到请求时合并切片
  await mergeRequest(fileName);
};

export { createFileChunk, calculateHash, uploadChunks, generateZip };
