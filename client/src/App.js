import { useState, useRef } from "react";
import SelectFile from "./components/select-btn";
import UploadBtn from "./components/upload-btn";
import PauseBtn from "./components/pause-btn";
import "./App.css";

function App() {
  const [fileName, setFileName] = useState("");
  // 上传文件至服务器的进度
  const [fileProgress, setFileProgress] = useState(0);

  const dataRef = useRef({
    fileName: {},
    chunkHashs: [],
    fileHash: "",
    hashToChunkMap: {},
  });

  const updateData = (newData) => {
    if (newData.fileName) {
      setFileName(newData.fileName);
    }

    dataRef.current = { ...dataRef.current, ...newData };
  };

  const pauseControllerRef = useRef(new AbortController());

  return (
    <div className="App">
      <SelectFile updateData={updateData} />
      <UploadBtn onUploadProgress={setFileProgress} dataRef={dataRef} controllerRef={pauseControllerRef} />
      <PauseBtn controllerRef={pauseControllerRef} />
      <div>上传服务器的进度：{fileProgress}</div>
    </div>
  );
}

export default App;
