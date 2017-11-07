
var fs = require('fs');
var express = require('express');
var bodyParser  = require('body-parser');
var app = express();

app.use(express.static(__dirname)).listen(8000, function(){
    console.log('Server running on 8000...');

})

app.use(bodyParser.json());

app.post('/scores', function(req, res) {
    var scores = require('./js/data/scores.json');      //read file and add new score, then save new score to file
    scores.push(req.body);
  fs.writeFile('./js/data/scores.json', JSON.stringify(scores), function(err) {
    if (err) {
      res.send('Something when wrong');
    } else {
      res.send('Saved!');
    }
  })
});

app.get('/scores', (req, res) => {
    var scores = require('./js/data/scores.json');
    res.json(scores);
});
