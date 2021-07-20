import FileModel from '../models/File.js'
import fileService from "../services/fileService.js"
import UserModel from "../models/User.js"
import config from 'config'
import fs from 'fs'


class FileController {

    async createDir(req, res) {
        try {
            const {name, type, parent} = req.body

            const file = new FileModel({name, type, parent, user: req.user.id})
            const parentFile = await FileModel.findOne({_id: parent})
            if (!parentFile) {
                file.path = name
                await fileService.createDir(file)
            } else {
                file.path = `${parentFile.path}\\${file.name}`
                await fileService.createDir(file)
                parentFile.child.push(file._id)
                await parentFile.save()
            }
            await file.save()
            return res.json(file)

        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async getFiles(req, res) {
        try {
            const files = await FileModel.find({user: req.user.id, parent: req.query.parent})
            return res.json(files)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Can not get files"})
        }
    }

    async uploadFile(req, res) {
        try {
            const file = req.files.file
            const type = file.name.split('.').pop()
            const size = file.size

            const parent = await FileModel.findOne({user: req.user.id, _id: req.body.parent})
            const user = await UserModel.findOne({_id: req.user.id})

            if (user.usedSpace + file.size > user.diskSpace) {
                return res.status(400).json({message: 'Not enough disk space'})
            }
            user.usedSpace += file.size

            let path;
            if (parent) {
                path = `${config.get('filePath')}\\${user._id}\\${parent.path}\\${file.name}`
            } else {
                path = `${config.get('filePath')}\\${user._id}\\${file.name}`
            }


            if (fs.existsSync(path)) {
                return res.status(400).json({message: "File already exists"})
            }
            console.log(path)
            console.log(user.usedSpace)

            await file.mv(path)

            const newFile = new FileModel({
                name: file.name,
                type: type,
                size: size,
                path: parent?.path,
                user: user._id,
                parent: parent?._id
            })

            await newFile.save()
            await user.save()

            res.json(newFile)


        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Upload error"})
        }
    }

}

const fileController = new FileController()

export default fileController