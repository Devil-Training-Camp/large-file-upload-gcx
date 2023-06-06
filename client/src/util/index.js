import { SIZE } from "../constants";

// 生成切片的大小
function createFileChunk(file, size = SIZE) {
  const fileChunkList = [];
  let cur = 0;
  while (cur < file.size) {
    fileChunkList.push({ file: file.slice(cur, cur + size) });
    cur += size;
  }

  return fileChunkList;
}

export { createFileChunk };
