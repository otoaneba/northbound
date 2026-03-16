import multer from "multer"
import path from "path"
import fs from "fs"

const uploadDir = path.join(process.cwd(), "tmp")

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

export const upload = multer({
  dest: uploadDir
})