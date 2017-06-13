module.exports = function(application) {
	application.use(function(req, res, next) {
	  var allowedOrigins = ['https://randomeet-app.herokuapp.com', 'https://randomeet-signaling.herokuapp.com'],
	  	  origin = req.headers.origin;
	  if(allowedOrigins.indexOf(origin) > -1){
	       res.setHeader('Access-Control-Allow-Origin', origin);
	  }
	  res.header('Access-Control-Allow-Credentials', true);
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token, Authorization");
	  res.header("Access-Control-Expose-Headers", "X-Auth-Token, Content-Type");
	  next();
	});
};