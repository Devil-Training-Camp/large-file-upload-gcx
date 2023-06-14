import React, { useState } from "react";
import { ProgressBar } from "../index";
import { createFileChunk, calculateHash, generateZip } from "../../util";

function SelectFile({ updateData, onMakingHash, dataReset }) {
  const [progressValue, setProgressValue] = useState("0");
  const [ziping, setZiping] = useState(false);
  const handleFileChange = async (e) => {
    onMakingHash && onMakingHash(false);
    //数据重置
    dataReset?.();
    const [file] = e.target.files;
    if (!file) {
      alert("请选择文件！");
      return;
    }
    setZiping(true);
    //TODO 这里有一个问题是文件压缩和计算 hash 值是耗时操作，需要再这些操作完成之后再上传
    // 压缩文件
    const fileZip = await generateZip(file);
    setZiping(false);
    // 分片
    const fileChunks = createFileChunk(fileZip);
    // 计算 hash 值
    const { fileHash, chunkHashs } = await calculateHash({ fileChunks, onProgress: setProgressValue });

    // 计算 hash 与 chunk 的映射
    const hashToChunkMap = new Map();
    fileChunks.forEach((chunk, index) => {
      hashToChunkMap.set(chunkHashs[index], {
        chunk,
        index,
      });
    });

    const data = { fileHash, chunkHashs, fileName: file.name, fileChunks, hashToChunkMap };
    onMakingHash && onMakingHash(true);
    updateData && updateData(data);
  };
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {ziping ? <div> 压缩文件中......</div> : <ProgressBar label={"计算 hash 值："} value={progressValue} max={100} />}
    </div>
  );
}

export default React.memo(SelectFile);
