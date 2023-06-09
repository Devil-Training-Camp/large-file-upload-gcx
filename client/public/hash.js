/* eslint-disable no-restricted-globals */
const workercode = () => {
  self.importScripts("https://cdn.jsdelivr.net/npm/spark-md5@3.0.2/spark-md5.min.js");
  self.onmessage = (e) => {
    const { fileChunkList } = e.data;
    const spark = new self.SparkMD5.ArrayBuffer();
    let percentage = 0;
    let count = 0;
    const loadNext = (index) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(fileChunkList[index].chunk);
      reader.onload = (e) => {
        count++;
        spark.append(e.target.result);
        if (count === fileChunkList.length) {
          self.postMessage({
            percentage: 100,
            hash: spark.end(),
          });
          self.close();
        } else {
          percentage += 100 / fileChunkList.length;
          self.postMessage({
            percentage,
          }); // calculate recursively
          loadNext(count);
        }
      };
    };
    loadNext(0);
  };
};

// 把脚本代码转为string
let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

const blob = new Blob([code], { type: "application/javascript" });
const workerScript = URL.createObjectURL(blob);

export default workerScript;
