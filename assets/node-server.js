	var http          =  require('http'),
    fs              = require('fs'),
    path        =  require('path'),
    express             =  require('express'),
    bodyParser          =  require('body-parser'),
    application         =  express();

/*var options = {
    key: fs.readFileSync('newkey.pem'),
    cert: fs.readFileSync('cert.pem')
};*/
application.use(bodyParser.json());
application.use(bodyParser.urlencoded({
    extended : true
}));

application.use(function(req, res, next) {
  var allowedOrigins = ['https://randomeet-app.herokuapp.com'],
      origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', true);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token, Authorization");
  res.header("Access-Control-Expose-Headers", "X-Auth-Token, Content-Type");
  next();
});

application.use(function(request, response) {
    var filePath = '.' + request.url;

    var extname = path.extname(filePath);

    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
    }

    fs.readFile(filePath, function(error, content) {
    console.log(error);
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
});

var http = http.createServer(application).listen(process.env.PORT, function(){
});