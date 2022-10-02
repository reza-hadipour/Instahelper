const multer = require('multer');
const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE = 1024*1024;

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

function getDirPath(){
    const date = new Date();
    const year = date.getFullYear()+"";
    const month = date.getMonth()+1+"";
    const day = date.getDate()+"";
    return `./public/upload/images/${year}/${month}/${day}`;
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize : 1024*1024 // 1MB + 1 byte
    }
});


module.exports = upload;