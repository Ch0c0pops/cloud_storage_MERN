import mongoose from "mongoose"

const File = new mongoose.Schema({
    name: {type: String, required: true},
    type: {type: String, required: true},
    accessLink: {type: String},
    size: {type: Number, default: 0}, // размер в байтах
    path: {type: String, default: ''},
    date: {type: Date, default: Date.now()},
    user: {type: mongoose.ObjectId, ref: 'User'},// ссылается на пользователя, чей файл
    parent: {type: mongoose.ObjectId, ref: 'File'}, //ссылается на внешнюю папку файла
    child: [{type: mongoose.ObjectId, ref: 'File'}] //на все внутренние файлы в папке
})

//File.index({name: 'text'})

const FileModel = mongoose.model('File', File)


export default FileModel