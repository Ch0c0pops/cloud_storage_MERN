import Router from 'express'
import UserModel from "../models/User.js"
import bcrypt from 'bcryptjs'
import {check, validationResult} from "express-validator"
import jwt from 'jsonwebtoken'
import config from 'config'
import authMiddleware from '../middleware/auth.middleware.js'
import fileService from "../services/fileService.js"
import FileModel from "../models/File.js"

const router = new Router()

router.post('/registration',

    [
        check('email', 'enter valid email').isEmail(),
        check('password', 'password length should be between 5 and 15 symbols').isLength({min: 5, max: 15})
    ],

    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'uncorrect request', errors})
            }
            const {email, password} = req.body

            const candidate = await UserModel.findOne({email})

            if (candidate) {
                return res.status(400).json({message: `user with this email already exists`})
            }

            const hashedPassword = await bcrypt.hash(password, 7)
            const user = new UserModel({email, password: hashedPassword})
            await user.save()
            await fileService.createDir(new FileModel({user: user.id, name:''}))
            res.json({message: 'new user has been created!'})

        } catch (e) {
            console.log(e)
            res.send({message: "server error!"})
        }
    })


router.post('/login',

    async (req, res) => {
        try {
            const {email, password} = req.body
            const user = await UserModel.findOne({email})
            if (!user) {
                return res.status(404).json({message: 'user with such email not found'})
            }
            const isPasswordValid = bcrypt.compareSync(password, user.password)
            if (!isPasswordValid) {
                return res.status(400).json({message: 'incorrect password'})
            }
            const token = jwt.sign({id: user.id}, config.get('secretKey'), {expiresIn: '1h'})
            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    diskSpace: user.diskSpace,
                    usedSpace: user.usedSpace,
                    avatar: user.avatar
                }
            })
        } catch (e) {
            console.log(e)
            res.send({message: "server error!"})
        }
    })

router.get('/auth', authMiddleware,

    async (req, res) => {
        try {
            const user = await UserModel.findOne({_id: req.user.id})
            const token = jwt.sign({id: user.id}, config.get('secretKey'), {expiresIn: '1h'})
            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    diskSpace: user.diskSpace,
                    usedSpace: user.usedSpace,
                    avatar: user.avatar
                }
            })
        } catch (e) {
            console.log(e)
            res.send({message: "server error!"})
        }
    })


export default router