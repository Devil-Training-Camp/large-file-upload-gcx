import { useState, useRef } from "react";
import { SelectFile, UploadBtn, PauseBtn, ContinueBtn } from "./components";
import "./App.css";

function App() {
  // 上传文件至服务器的进度
  const [fileProgress, setFileProgress] = useState(0);
  const [isMakingHash, setIsMakingHash] = useState(false);

  const dataRef = useRef({
    fileName: {},
    chunkHashs: [],
    fileHash: "",
    hashToChunkMap: {},
  });

  const updateData = (newData) => {
    dataRef.current = { ...dataRef.current, ...newData };
  };

  const pauseControllerRef = useRef(new AbortController());

  return (
    <div className="App">
      <SelectFile updateData={updateData} onMakingHash={setIsMakingHash} />
      {isMakingHash ? (
        <>
          <UploadBtn onUploadProgress={setFileProgress} dataRef={dataRef} controllerRef={pauseControllerRef} />
          <PauseBtn controllerRef={pauseControllerRef} />
          <ContinueBtn dataRef={dataRef} updateData={updateData} controllerRef={pauseControllerRef} />
          <div>上传服务器的进度：{fileProgress}</div>
        </>
      ) : null}
    </div>
  );
}

export default App;
