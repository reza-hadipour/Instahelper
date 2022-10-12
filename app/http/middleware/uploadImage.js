const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        let dir = getDirPath();
        fs.mkdirSync(dir,{recursive:true});
        cb(null,dir);
    },
    filename: (req,file,cb)=>{
        let filename = file.fieldname + '_' + Date.now() + '-' + Math.round(Math.random()* 1E9) +path.extname(file.originalname)
        cb(null,filename);
    }
});


const fileFilter = (req,file,cb)=>{
    let fileExt = ['.PNG','.JPG','.JPEG','.SVG'];
    req.body.pageimage = file.originalname  // To check file in pageValidation

    if( ! fileExt.includes(path.extname(file.originalname).toUpperCase())){
        cb(null,false);
    }else{
        cb(null,true);
    }
}

const fileFilterArray = (req,file,cb)=>{
    let fileExt = ['.PNG','.JPG','.JPEG','.SVG'];
    
    if(req?.body?.postimage){
        req.body.postimage[file.originalname] = file.originalname  // To check file in postValidation
    }else{
        req.body.postimage = {};
        req.body.postimage[file.originalname] = file.originalname
    }

    if( ! fileExt.includes(path.extname(file.originalname).toUpperCase())){
        cb(null,false);
    }else{
        cb(null,true);
    }
}

function getDirPath(){
    const date = new Date();
    const year = date.getFullYear()+"";
    const month = date.getMonth()+1+"";
    const day = date.getDate()+"";
    return `./public/upload/images/${year}/${month}/${day}`;
}

const uploadPage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize : CONSTS.PAGE_MAX_FILE_SIZE // 1MB + 1 byte
    }
});

const uploadPost = multer({
    storage,
    fileFilter: fileFilterArray,
    limits: {
        fileSize : CONSTS.POST_MAX_FILE_SIZE, // 2MB + 1 byte
        
    }
});


module.exports = {
    uploadPage,
    uploadPost
}