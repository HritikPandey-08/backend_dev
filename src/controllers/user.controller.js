import { aysncHandler } from "../utils/asyncHandler.js"

const userRegister = aysncHandler(async (req,res) => {
    res.status(200).json({
        message : "Hello world"
    })

})

export { userRegister }