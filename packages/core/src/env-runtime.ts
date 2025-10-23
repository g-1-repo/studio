import process from 'node:process'
import { parseEnv } from './env'

export default parseEnv(process.env)
