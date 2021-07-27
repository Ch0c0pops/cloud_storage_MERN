import mongoose from 'mongoose'
import express from 'express'
import config from 'config'
import authRouter from '../server/routes/auth.routes.js'
import fileRouter from '../server/routes/file.routes.js'
import corsMiddleware from './middleware/cors.middleware.js'
import fileupload from 'express-fileupload'

const app = express()
const PORT = config.get('serverPort')
const mongoURI = config.get('mongoURI')

app.use(fileupload({}))
app.use(express.static('static'))
app.use(corsMiddleware)
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/files', fileRouter)


const start = async () => {
    try {
        await mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true}, () => {
        })

        app.listen(PORT, () => {
            console.log('server is running on port', PORT)
        })
    } catch (e) {
        console.log(e)
    }
}

start()