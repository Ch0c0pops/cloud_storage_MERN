import fs from 'fs'
import config from 'config'
import FileModel from '../models/File.js'


class FileService {

    createDir(file) {
        const filePath = `${config.get('filePath')}\\${file.user}\\${file.path}`
        return new Promise((resolve, reject) => {

            try {
                if (!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath)
                    return resolve({message: 'File has been created'})
                } else {

                    return reject({message: 'File already exists'})
                }
            } catch (e) {
                return reject({message: 'File error'})
            }
        })
    }

    deleteFile(file) {
        const filePath = `${config.get('filePath')}\\${file.user}\\${file.path}`

        if (file.type === 'dir') {
            fs.rmdirSync(filePath)
        } else {
            fs.unlinkSync(filePath)
        }

    }
}

const fileService = new FileService()
export default fileService