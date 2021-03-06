import FileModel from '../models/File.js'
import fileService from "../services/fileService.js"
import UserModel from "../models/User.js"
import config from 'config'
import fs from 'fs'
import {v4 as uuidv4} from 'uuid'


class FileController {

    async createDir(req, res) {
        try {
            const {name, type, parent} = req.body

            const file = new FileModel({name, type, parent, user: req.user.id})
            const parentFile = await FileModel.findOne({_id: parent})
            if (!parentFile) {
                file.path = name
                await fileService.createDir(req, file)
            } else {
                file.path = `${parentFile.path}\\${file.name}`
                await fileService.createDir(req, file)
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
                path = `${req.filePath}\\${user._id}\\${parent.path}\\${file.name}`
            } else {
                path = `${req.filePath}\\${user._id}\\${file.name}`
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
                type,
                size,
                path: filePath,
                user: user._id,
                parent: parent? parent._id : null
            })
            if (parent) {
                parent.size = parent.size + file.size
                await parent.save()
            }

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
            const path = `${req.filePath}\\${req.user.id}\\${file.path}`

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
            const parent = await FileModel.findOne({_id: file.parent, user: req.user.id})

            const path = `${req.filePath}\\${req.user.id}\\${file.path}`

            if (!file) {
                return res.status(400).json({message: 'File not found'})
            }
            if (parent) {
                parent.size = parent.size - file.size
                await parent.save()
            }
            await fileService.deleteFile(req, file)
            await file.remove()

            return res.json({message: 'file was deleted'})

        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'Delete error, directory might be not empty'})
        }
    }

    async searchFile(req, res) {

        try {
            const {searchParam} = req.query

            const found = await FileModel.find({user: req.user.id})
            let files = [...found]
            const filtered = files.filter(f => f.name.toLowerCase().includes(searchParam.toLowerCase()))

            return res.json(filtered)

        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'Search error'})
        }
    }

    async uploadAvatar(req, res) {

        try {
            const file = req.files.file
            const user = await UserModel.findById(req.user.id)
            const fileName = uuidv4() + ".jpg"
            file.mv(config.get('staticPath') + "\\" + fileName)
            user.avatar = fileName
            await user.save()
            return res.json(user)

        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'Avatar uploading error'})
        }
    }

    async deleteAvatar(req, res) {

        try {
            const user = await UserModel.findById(req.user.id)
            await fs.unlinkSync(`${config.get('staticPath') + "\\" + user.avatar}`)
            user.avatar = null
            await user.save()
            return res.json(user)

        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'Avatar deleting error'})
        }
    }
}


const fileController = new FileController()

export default fileController