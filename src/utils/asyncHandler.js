// const asyncHandler = (requestHandler) => async(req, res, next) => {
//     try {
//          await requestHandler(req, res, next)
//     } catch (err) {
//         res.status(err.code||500).json({
//             success: false,
//             message:'Fail to request '
//         })
        
//     }
// }

// export {asyncHandler}


const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        // Promise(requestHandler(req, res, next).resolve().catch((err) => next(err)))
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))

    }
}

export {asyncHandler}

