// Using instead of 'try-catch'

module.exports = (fn) => {
  // any args (defined for calling in fn!)
  return (req, res, next) => {
    // immediately execute after return
    fn(req, res, next).catch(next); // === err=>next(err)
  };
};

// const fn = catchAsync( async(req,res,next)=>{} )
