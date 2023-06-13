import React, { useState } from "react";
import { createFileChunk, calculateHash, generateZip } from "../../util";

function SelectFile({ updateData, onMakingHash }) {
  const [progressValue, setProgressValue] = useState("0");
  console.log(progressValue);
  const handleFileChange = async (e) => {
    onMakingHash && onMakingHash(false);
    const [file] = e.target.files;
    if (!file) {
      alert("请选择文件！");
      return;
    }
    //TODO 这里有一个问题是文件压缩和计算 hash 值是耗时操作，需要再这些操作完成之后再上传
    // 压缩文件
    const fileZip = await generateZip(file);
    // 分片
    const fileChunks = createFileChunk(fileZip);
    // 计算 hash 值
    const { fileHash, chunkHashs } = await calculateHash(fileChunks, setProgressValue);

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
    </div>
  );
}

export default React.memo(SelectFile);
