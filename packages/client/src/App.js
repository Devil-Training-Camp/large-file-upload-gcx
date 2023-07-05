import { useState, useRef } from "react";
import { SelectFile, UploadBtn, PauseBtn, ContinueBtn, ProgressBar } from "./components";
import "./App.css";

function App() {
  // 上传文件至服务器的进度
  const [isMakingHash, setIsMakingHash] = useState(false);
  const [progressMax, setProgressMax] = useState(0);
  const [progressValue, setProgressValue] = useState(0);

  const dataRef = useRef({
    fileName: {},
    chunkHashs: [],
    fileHash: "",
    hashToChunkMap: {},
  });

  const updateData = (newData) => {
    if (newData.chunkHashs) {
      setProgressMax(newData.chunkHashs.length);
    }
    dataRef.current = { ...dataRef.current, ...newData };
  };

  const dataReset = () => {
    setProgressValue(0);
  };

  const pauseControllerRef = useRef(new AbortController());

  return (
    <div className="App">
      <SelectFile updateData={updateData} onMakingHash={setIsMakingHash} dataReset={dataReset} />
      {isMakingHash ? (
        <>
          <UploadBtn setProgressValue={setProgressValue} dataRef={dataRef} controllerRef={pauseControllerRef} />
          <ProgressBar max={progressMax} value={progressValue} label={"上传进度条："} />
          <PauseBtn controllerRef={pauseControllerRef} />
          <ContinueBtn
            dataRef={dataRef}
            updateData={updateData}
            controllerRef={pauseControllerRef}
            setProgressValue={setProgressValue}
          />
        </>
      ) : null}
    </div>
  );
}

export default App;
