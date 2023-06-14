import React from "react";
import { uploadChunks } from "../../util";

function UploadBtn({ controllerRef, setProgressValue, dataRef }) {
  // 上传到服务器的进度
  const handleUpload = async () => {
    const { fileName, fileHash, chunkHashs, hashToChunkMap } = dataRef.current;
    if (hashToChunkMap.size === 0) return alert("请选择要上传的文件");

    await uploadChunks({
      fileName,
      fileHash,
      chunkHashs,
      hashToChunkMap,
      onUploadProgress: () => setProgressValue((value) => value + 1),
      onUploadQuickProcess: () => setProgressValue(chunkHashs.length),
      controllerRef,
    });
  };
  return (
    <div>
      <button onClick={handleUpload}>上传</button>
    </div>
  );
}

export default React.memo(UploadBtn);
