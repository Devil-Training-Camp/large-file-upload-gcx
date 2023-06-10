import React, { useState } from "react";
import { createFileChunk, calculateHash } from "../../util";

function SelectFile({ updateData }) {
  // const [ziping, setZiping] = useState(false)
  const [progressValue, setProgressValue] = useState("0");
  // console.log(progressValue);
  const handleFileChange = async (e) => {
    const [file] = e.target.files;
    if (!file) {
      alert("请选择文件！");
      return;
    }
    // 分片
    const fileChunks = createFileChunk(file);
    // 计算 hash 值
    const { fileHash, chunkHashs } = await calculateHash(fileChunks, setProgressValue);
    // console.log(allChunkFilesHash);

    // 计算 hash 与 chunk 的映射
    const hashToChunkMap = new Map();
    fileChunks.forEach((chunk, index) => {
      hashToChunkMap.set(chunkHashs[index], {
        chunk,
        index,
      });
    });

    const data = { fileHash, chunkHashs, fileName: file.name, fileChunks, hashToChunkMap };

    updateData && updateData(data);
  };
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
    </div>
  );
}

export default React.memo(SelectFile);
