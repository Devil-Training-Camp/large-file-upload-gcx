import React from "react";
import { getCanContinue } from "../../api/request";
import { uploadChunks } from "../../util";

const ContinueBtn = (props) => {
  const { controllerRef, dataRef, setProgressValue } = props;
  const handleClickUpload = async () => {
    const { fileName, hashToChunkMap, chunkHashs, fileHash } = dataRef.current;

    const { isContinue, uploadedHashs } = await getCanContinue({ fileName, fileHash, chunkHashs });
    if (!isContinue) {
      // alert("目标文件已上传完毕，请勿重复上传");
      return;
    }

    // 过滤掉已经上传的chunk
    const restHashs =
      isContinue === "noChunk" ? chunkHashs : chunkHashs.filter((chunkHash) => !uploadedHashs.includes(chunkHash));
    isContinue === "partChunk" && setProgressValue(uploadedHashs.length);

    await uploadChunks({
      fileName,
      hashToChunkMap,
      chunkHashs: restHashs,
      fileHash,
      controllerRef,
      onOneChunkUploaded: () => setProgressValue((value) => value + 1),
      onQuickUploaded: () => {
        setProgressValue(chunkHashs.length);
      },
    });
  };

  return (
    <button className="continue-btn" onClick={handleClickUpload}>
      继续
    </button>
  );
};
export default React.memo(ContinueBtn);
