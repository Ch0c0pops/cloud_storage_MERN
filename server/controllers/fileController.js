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

        let {sort} = req.query
        let files

        try {
            switch (sort) {
                case 'name':
                    files = await FileModel.find({user: req.user.id, parent: req.query.parent}).sort({name: 1})
                    break;
                case 'type':
                    files = await FileModel.find({user: req.user.id, parent: req.query.parent}).sort({type: 1})
                    break;
                case 'date':
                    files = await FileModel.find({user: req.user.id, parent: req.query.parent}).sort({date: 1})
                    break;
                default:
                    files = await FileModel.find({user: req.user.id, parent: req.query.parent})
                    break;
            }

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

            await file.mv(path)

            let filePath = file.name
            if (parent) {
                filePath = parent.path + "\\" + file.name
            }

            const newFile = new FileModel({
                name: file.name,
                type: type,
                size: size,
                path: filePath,
                user: user._id,
                parent: parent?._id
            })
            parent.size = parent.size + file.size
            await parent.save()
            await newFile.save()
            await user.save()

            res.json(newFile)


        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Upload error"})
        }
    }

    async downloadFile(req, res) {
        try {
            const file = await FileModel.findOne({_id: req.query.id, user: req.user.id})
            const path = `${config.get('filePath')}\\${req.user.id}\\${file.path}`

            if (fs.existsSync(path)) {
                return res.download(path, file.name)
            }

            return res.status(400).json({message: 'Download error'})

        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'Download error'})
        }
    }

    async deleteFile(req, res) {
        try {
            const file = await FileModel.findOne({_id: req.query.id, user: req.user.id})
            const path = `${config.get('filePath')}\\${req.user.id}\\${file.path}`

            if (!file) {
                return res.status(400).json({message: 'File not found'})
            }
            await fileService.deleteFile(file)
            await file.remove()

            return res.json({message: 'file was deleted'})

        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'Delete error, directory might be not empty'})
        }
    }

}

const fileController = new FileController()

export default fileController