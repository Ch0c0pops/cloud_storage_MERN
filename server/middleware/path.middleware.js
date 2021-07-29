const pathMW = (path) => {
    return (req, res, next) => {
        req.filePath = path
        next();
    }
}


export default pathMW