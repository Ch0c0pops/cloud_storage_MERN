import fs from 'fs'


class FileService {

    createDir(req, file) {
        const filePath = `${req.filePath}\\${file.user}\\${file.path}`
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

    deleteFile(req, file) {
        const filePath = `${req.filePath}\\${file.user}\\${file.path}`

        if (file.type === 'dir') {
            fs.rmdirSync(filePath)
        } else {
            fs.unlinkSync(filePath)
        }

    }
}

const fileService = new FileService()
export default fileService