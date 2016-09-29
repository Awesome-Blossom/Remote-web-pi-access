const app= require('http').createServer(server); // build an http server
const io = require('socket.io')(app);
const fs = require('fs'); // load the file system module
const spawn = require('child_process').spawn; // load the "spawn" method of the child_process library
const Split = require('stream-split'); // both memory & cpu efficient way to split stream into readable chunks of data.

app.listen(3000);  //opens up the port/

function server (req, res) {
  fs.readFile(__dirname + '/index.html',  // reads the contents of index.html
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');    //if error loading webpage
      }

      res.writeHead(200); // Writes HTTP headers under TCP stream
      res.end(data); // Writes the data itself
    }
  );
}

io.on('connection', function(socket) {  //opens up websocket connection with user's browser
  var frames = 0;
  // Runs this terminal command and keeps it open for standard input and
  // output (STDIO):
  var raspivid = spawn('raspivid',
      ['-w', '1280',
       '-h', '960',
       '-fps', '30',
       '-o','-',
       '-t','0',
       '-n',
       '-cd', 'MJPEG']
  ); 
  // The beginning of a jpeg file, which we'll use to split the stream into individual frames:
  var delimiter = new Buffer([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

  // Create a new splitter object, which takes a stream and splits it into chunks. Splits by the delimiter.
  var splitter = new Split( delimiter );
  raspivid.stdout.pipe(splitter); // Pipe the output from the raspivid process into the splitter.

  splitter.on('data', function (chunk) {
    frames = ++frames % 30;
    if (frames === 29) { socket.emit('markTime', Date.now() ) };
    // Add the delimiter back into the buffer (the splitter removes it) and
    // convert the frame into base64 so that it can be sent to the client and
    // inserted as an image:
    frame = Buffer.concat([delimiter, chunk]).toString('base64');
    socket.emit('frame', frame);
  });
});
