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
        let filename = file.fieldname + '_' + Date.now() + path.extname(file.originalname)
        req.body.image = getDirPath() + '\\' + filename;
        cb(null,filename);
    }
})


const fileFilter = (req,file,cb)=>{
    let fileExt = ['.PNG','.JPG','.JPEG','.SVG'];
    if( ! fileExt.includes(path.extname(file.originalname).toUpperCase())){
        // req.body.image = "pageDef.jpg"
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
    return path.join('./public/upload/images/',year,month,day)
}

const upload = multer({
    storage,
    fileFilter
});


module.exports = upload;