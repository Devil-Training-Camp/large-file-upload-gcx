const http = require("http");
const path = require("path");
const fse = require("fs-extra");
const multiparty = require("multiparty");

const server = http.createServer();
// 大文件存储目录
const UPLOAD_DIR = path.resolve(__dirname, "..", "target");

const multipart = new multiparty.Form();

server.on("request", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.status = 200;
    res.end();
    return;
  }

  multipart.parse(req, async (err, fields, files) => {
    if (err) return;

    const [chunk] = files.chunk;
    const [hash] = fields.hash;
    const [fileName] = fields.fileName;

    /**
     * 创建临时文件用于临时存储 chunk
     * 添加 chunkDir 前缀与文件名做区分
     * */
    const chunkDir = path.resolve(UPLOAD_DIR, "chunkDir" + fileName);

    if (!fse.existsSync(chunkDir)) {
      await fse.mkdirs(chunkDir);
    }

    // fs-extra 的 rename 方法 window 平台会有权限问题
    // @see https://github.com/meteor/meteor/issues/7852#issuecomment-255767835
    await fse.move(chunk.path, `${chunkDir}/${hash}`);
    res.end("received file chunk");
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`learning port ${PORT}`);
});
