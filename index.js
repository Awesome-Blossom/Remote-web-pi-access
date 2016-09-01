const app= require('http').createServer(server);
const io = require('socket.io')(app);
const fs = require('fs');
const spawn = require('child_process').spawn;
const Split = require('stream-split');

app.listen(3000);

function server (req, res) {
  fs.readFile(__dirname + '/test.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
	return res.end('Error loading index.html');
      }

      res.writeHead(200);
      res.end(data);	
    }
  );
}

io.on('connection', function(socket) {
  var raspivid = spawn('raspivid', ['-w', '1280', '-h', '960', '-fps', '30', '-o','-','-t','0','-n', '-cd', 'MJPEG']);
  var delimiter = new Buffer([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

  var splitter = new Split( delimiter );
  raspivid.stdout.pipe(splitter);
  
  splitter.on('data', function (chunk) {
    frame = Buffer.concat([delimiter, chunk]).toString('base64');
    socket.emit('frame', frame);
  });
});
