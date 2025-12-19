/**
 * Wrap an async Express handler so errors go to error middleware.
 * @param {(req,res,next)=>Promise<any>} fn
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
