// Add custom middleware here

export const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
}

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  })
}
