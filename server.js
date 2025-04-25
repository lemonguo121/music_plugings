import express from "express";
import cors from "cors";  // 如果你的项目有跨域需求，可以使用这个

const app = express();
const port = process.env.PORT || 3000;  // Render 会自动传递 PORT 环境变量，如果没有设置就使用默认的 3000

// 中间件：解析 JSON 请求体
app.use(express.json());
app.use(cors());  // 允许跨域请求

// 你的路由配置
app.get("/", (req, res) => {
  res.send("Hello, welcome to your Render-deployed app!");
});

// 在这里添加其他 API 路由

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});