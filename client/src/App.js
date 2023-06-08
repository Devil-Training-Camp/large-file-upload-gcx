import { useCallback, useState } from "react";
import { createFileChunk } from "./util";
import { request } from "./util/http";
import { BASE_URL, SIZE } from "./constants";
import "./App.css";

function App() {
  const [originFile, setOriginFile] = useState(undefined);
  const [fileChunkList, setFileChunkList] = useState([]);
  const [totalProgress, setTotalProgress] = useState(0);

  const handleFileChange = async (e) => {
    const [file] = e.target.files;
    if (!file) return;
    setOriginFile(file);
  };

  const createProgressHandler = useCallback(
    (index) => (e) => {
      setFileChunkList((prevList) => {
        const newList = [...prevList];
        // 设置切片的进度条
        newList[index]["percentage"] = parseInt(String((e.loaded / e.total) * 100));

        // 设置总上传进度
        const totalPercentage = newList.reduce((total, chunk) => total + chunk.percentage, 0) / newList.length;
        setTotalProgress(totalPercentage);
        return newList;
      });

      console.log(totalProgress, fileChunkList);
    },
    [fileChunkList]
  );

  const uploadChunks = async (fileChunkList) => {
    const requestList = fileChunkList
      .map(({ chunk, hash, index }) => {
        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("hash", hash);
        formData.append("fileName", originFile.name);
        return { formData, index };
      })
      .map(({ formData, index }) => {
        return request({
          url: `${BASE_URL}/upload`,
          data: formData,
          onProgress: createProgressHandler(index),
        });
      });

    await Promise.all(requestList);

    // 前端发送额外的合并请求，服务端接受到请求时合并切片
    await mergeRequest();
  };

  const mergeRequest = async () => {
    await request({
      url: `${BASE_URL}/upload/merge`,
      headers: {
        "content-type": "application/json",
      },
      data: JSON.stringify({
        fileName: originFile.name,
        size: SIZE,
      }),
    });
  };
  const handleUpload = async () => {
    if (!originFile) return alert("请上传文件");
    const fileChunk = createFileChunk(originFile);
    const fileChunkList = fileChunk.map(({ file }, index) => ({
      chunk: file,
      index,
      // 文件名 + 数组下标
      hash: originFile.name + "-" + index,
      percentage: 0,
    }));
    setFileChunkList(fileChunkList);

    await uploadChunks(fileChunkList);
  };
  return (
    <div className="App">
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>上传</button>
    </div>
  );
}

export default App;
