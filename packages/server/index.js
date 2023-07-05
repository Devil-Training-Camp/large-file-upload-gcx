const http = require('http');
const path = require('path');
const fse = require('fs-extra');
const multiparty = require('multiparty');
const JSZip = require('jszip');

const server = http.createServer();
// 提取后缀名
const extractExt = (filename) => filename.slice(filename.lastIndexOf('.'), filename.length);

// 大文件存储目录
const UPLOAD_DIR = path.resolve(__dirname, '..', 'target');

// 文件切片存储目录
const CHUNK_DIR = path.resolve(__dirname, '..', 'target_chunk');

function isExistFile(filePath, fileName = '') {
  try {
    return fse.existsSync(path.resolve(filePath, fileName));
  } catch (error) {
    return false;
  }
}
const getChunkDir = (fileHash) => path.resolve(CHUNK_DIR, `${fileHash}-chunks`);

// 解析 data 数据
const resolvePost = (req) => {
  return new Promise((resolve) => {
    let chunk = '';
    req.on('data', (data) => {
      chunk += data;
    });
    req.on('end', () => {
      resolve(JSON.parse(chunk));
    });
  });
};

// 写入文件流
const pipeStream = (path, writeStream) =>
  new Promise((resolve) => {
    const readStream = fse.createReadStream(path);
    readStream.on('end', () => {
      fse.unlinkSync(path);
      resolve();
    });
    readStream.pipe(writeStream);
  });

server.on('request', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status = 200;
    res.end();
    return;
  }

  if (req.url === '/upload') {
    const multipart = new multiparty.Form();
    multipart.parse(req, async (err, fields, files) => {
      if (err) return;
      const [chunk] = files.chunk;
      const [chunkHash] = fields.chunkHash;
      const [fileHash] = fields.fileHash;

      /**
       * 创建临时文件用于临时存储 chunk
       * 添加 fileHash + chunks 存放所有的切片
       * */
      const chunkDir = getChunkDir(fileHash);

      if (!fse.existsSync(chunkDir)) {
        await fse.mkdirs(chunkDir);
      }

      // 判断 切片是否存在
      if (isExistFile(chunkDir, chunkHash)) {
        res.end(
          JSON.stringify({
            code: 0,
            message: 'received file chunk',
            // isExist: true,
          }),
        );
        return;
      }

      // fs-extra 的 rename 方法 window 平台会有权限问题
      // @see https://github.com/meteor/meteor/issues/7852#issuecomment-255767835
      await fse.move(chunk.path, `${chunkDir}/${chunkHash}`);
      res.end(JSON.stringify({ code: 0, message: 'received file chunk' }));
    });
  }

  //通过文件的 hash 值来验证文件是否已上传
  if (req.url === '/upload/verify') {
    const { fileHash, fileName } = await resolvePost(req);
    const ext = extractExt(fileName);
    const filePath = path.resolve(CHUNK_DIR, `${fileHash}${ext}`);
    // const filePath = path.resolve(UPLOAD_DIR, fileName);
    if (fse.existsSync(filePath)) {
      res.end(
        JSON.stringify({
          instantTransmission: true,
        }),
      );
    } else {
      res.end(
        JSON.stringify({
          instantTransmission: false,
        }),
      );
    }
  }

  if (req.url === '/upload/merge') {
    const data = await resolvePost(req);
    const { fileName, fileHash, chunk_size } = data;

    const chunkFilePath = getChunkDir(fileHash);
    const extension = extractExt(fileName);

    // !!! 合并文件后的路径，这里合并的文件之所以要单独拿出来，是因为上传的文件都是压缩包，需要解压文件存放在指定位置
    const generateMergeFilePath = path.resolve(CHUNK_DIR, `${fileHash}${extension}`); //获取切片路径
    await mergeFileChunk({ generateMergeFilePath, chunkFilePath, fileHash, chunk_size });

    // 将合并后的文件解压到指定位置
    unZip(generateMergeFilePath, fileName);

    res.end(JSON.stringify({ code: 0, message: 'file merged success' }));
  }

  if (req.url === '/upload/can_continue') {
    const { fileName, fileHash } = await resolvePost(req);

    /**
     * 继续上传考虑三种情况：
     * 1. 目标文件已上传完毕
     * 2. 已上传部分切片文件
     * 3. 一个切片都没有上传
     */

    // 判断在 target_chunk 目录中是否已存在目标文件
    if (isExistFile(CHUNK_DIR, `${fileHash}${extractExt(fileName)}`)) {
      res.end(JSON.stringify({ isContinue: false }));
      return;
    }
    // 判断 target_chunk 目录中是否存在切片文件夹
    const chunkDir = getChunkDir(fileHash);
    if (!isExistFile(chunkDir)) {
      res.end(JSON.stringify({ isContinue: 'noChunk' }));
      return;
    }
    // 已上传部分切片
    const chunkPaths = await fse.readdir(chunkDir);
    const existHashs = chunkPaths.map((chunkPath) => chunkPath.split('-')[0]);
    if (chunkPaths.length > 0) {
      // 服务端存在部分chunk文件，可续传
      res.end(
        JSON.stringify({
          isContinue: 'partChunk',
          uploadedHashs: existHashs,
        }),
      );
      return;
    }
    res.end(JSON.stringify({ isContinue: false }));
    return;
  }
});

// 合并切片放在 chunks 目录下
const mergeFileChunk = async ({ generateMergeFilePath, chunkFilePath, chunk_size }) => {
  const chunkPaths = await fse.readdir(chunkFilePath);
  // 根据切片下标进行排序
  // 否则直接读取目录的获得的顺序会错乱
  chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1]);
  // 并发写入文件
  const arr = await Promise.all(
    chunkPaths.map((chunkPath, index) =>
      pipeStream(
        path.resolve(chunkFilePath, chunkPath),
        // 根据 size 在指定位置创建可写流
        fse.createWriteStream(generateMergeFilePath, { start: index * chunk_size, end: (index + 1) * chunk_size }),
      ),
    ),
  );

  await Promise.all(arr);
  // 合并后删除保存切片的目录
  // fse.rmdirSync(chunkFilePath);
};

async function unZip(generateMergeFilePath, fileName) {
  try {
    const jszip = new JSZip();
    const buffer = await fse.readFile(generateMergeFilePath);
    await jszip.loadAsync(buffer, { base64: true });
    const content = await jszip.files[fileName].async('nodebuffer');

    const dest = path.resolve(UPLOAD_DIR, fileName);
    if (!fse.existsSync(UPLOAD_DIR)) {
      //文件夹不存在，新建该文件夹
      await fse.mkdirs(UPLOAD_DIR);
    }

    const arrayBuffer = await (content.arrayBuffer?.() || content);
    const buf = Buffer.from(arrayBuffer);
    await fse.writeFile(dest, buf);
  } catch (err) {
    console.warn(err);
  }
}

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`learning port ${PORT}`);
});
