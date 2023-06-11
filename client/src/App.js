import { useState, useRef } from "react";
import SelectFile from "./components/select-btn";
import UploadBtn from "./components/upload-btn";
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

    console.log(newData);

    dataRef.current = { ...dataRef.current, ...newData };
  };
  return (
    <div className="App">
      <SelectFile updateData={updateData} />
      <div>上传的文件名：{fileName}</div>
      <UploadBtn onUploadProgress={setFileProgress} dataRef={dataRef} />
      <div>上传服务器的进度：{fileProgress}</div>
    </div>
  );
}

export default App;
