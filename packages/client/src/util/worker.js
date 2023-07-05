/* eslint-disable no-restricted-globals */

self.importScripts("https://cdn.jsdelivr.net/npm/spark-md5@3.0.2/spark-md5.min.js");
self.onmessage = async (e) => {
  const { fileChunks } = e.data;
  const spark = new self.SparkMD5.ArrayBuffer();
  let percentage = 0;
  const loadNext = (fileChunk) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(fileChunk);
      reader.onload = (e) => {
        spark.append(e.target.result);
        percentage += 100 / fileChunks.length;
        resolve({
          percentage,
          chunkHash: self.SparkMD5.ArrayBuffer.hash(e.target.result),
        });
      };
    });
  };
  for (let fileChunk of fileChunks) {
    const result = await loadNext(fileChunk["file"]);
    self.postMessage(result);
  }

  self.postMessage({
    percentage: 100,
    fileHash: spark.end(),
  });
  self.close();
};
