import dotenv from 'dotenv'
import LoveMsg from './libs/LoveMsg'
dotenv.config()

// 早安、午安、晚安、生日助手 => 由环境变量控制
LoveMsg()
