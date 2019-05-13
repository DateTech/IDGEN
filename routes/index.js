var express = require('express');
var router = express.Router();
var nodeMailer = require('nodemailer');
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var request = require('request');
var upload = multer({ dest: 'routes/database/img/'});


let transporter = nodeMailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,  //true for 465 port, false for other ports
  auth: {
      user: 'dayo7379@gmail.com',
      pass: 'iamserverr1'
  }
});

function mailOption(email, link, name){
  let mailOptions = {
    from: '"ID GEN" <no-reply@idgen.com>', // sender address
    to: email, // list of receivers
    subject: 'Email Verification ✔', // Subject line
    text: 'Hello world', // plain text body
    html: '<b>Hello '+name+',</b> <br /> Click <a href="'+link+'"> here </a> to verify email <br /> <span>Thanks for using ID GEN</span>' // html body
  };
  return mailOptions;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  session = req.session; 

  if(session.UniqueID){
     res.redirect('/continue');
  }else{
    res.render('index', { title: 'Identity Card Generator' });
  }
});

router.get('/login', function(req, res, next) {
  session = req.session; 

  if(session.UniqueID){
    res.redirect('/continue');
  }else{
    res.render('login', { layout: false });
  }
});

router.get('/logout', function(req, res, next){
  req.session.destroy(function(err){
    if(err){throw err;}
  });
  res.redirect('/login');
});

router.get('/continue', function(req, res, next){
  session = req.session; 

  if(session.UniqueID){
    var sql = 'SELECT image,state FROM record WHERE id ="'+session.UniqueID+'"';
    conn.each(sql, function(err, row){
      if (err) {
        throw err;
      }
      if(row && row.image != null && row.state != ""){
        res.redirect('/main');
      }else{
        var sql = 'SELECT * FROM record WHERE id="'+session.UniqueID+'"';
        conn.each(sql, function(err, row){
          if (err) {
            throw err;
          }
          if(row){
            res.render('continue', { title: 'Identity Card Generator', data: row, session: session.UniqueID });
          }
        });
      }
    }); 
  }else{
    res.redirect('/login');
  }
});

router.get('/print', function(req, res, next){
  session = req.session; 

  if(session.UniqueID){
    var sql = 'SELECT * FROM record WHERE id="'+session.UniqueID+'"';
    conn.each(sql, function(err, row){
      if (err) {
        throw err;
      }
      if(row){
        if (row.image != null){
          var bufferBase64 = new Buffer( row.image, 'binary' ).toString('base64');
          row.img= bufferBase64;
        }
        res.render('print', { title: 'Identity Card - Print', data: row, session: session.UniqueID });
      }
    });
  }else{
    res.redirect('/login');
  }
});

router.get('/settings',function(req, res, next){
  session = req.session; 

  if(session.UniqueID){
    res.render('settings', {title: 'Identity Card - Settings', session: session.UniqueID})
  }else{
    res.redirect('/login');
  }
});

router.get('/main', function(req, res, next){
  session = req.session; 

  if(session.UniqueID){
    var sql = 'SELECT * FROM record WHERE id="'+session.UniqueID+'"';
    conn.each(sql, function(err, row){
      if (err) {
        throw err;
      }
      if(row){
        if (row.image != null){
          var bufferBase64 = new Buffer( row.image, 'binary' ).toString('base64');
          row.img= bufferBase64;
        }
        res.render('main', { title: 'Identity Card Generator', data: row, session: session.UniqueID });
      }
    });
  }else{
    res.redirect('/login');
  }
});

router.post('/verify', function(req, res, next){
  var data = req.body;
  var sql = "INSERT INTO record (lname,fname,email,password) VALUES(?,?,?,?)";
  conn.run(sql, [data.lname,data.fname,data.email,data.pwd], function(err, result){
    if(err){
      throw err;
    }

    transporter.sendMail(mailOption(data.email, "http://localhost:3000/verify/"+data.email, data.lname), function(err, info){
      if(err){
          throw err;
      }else{
        res.render('verify', {layout: false, email: data.email});
      }
    });
  });
});

router.get('/verify/:email', function(req, res){
  var email = req.params.email;

  var sql = "SELECT verify FROM record WHERE email='"+email+"'";
  conn.each(sql, function(err, row){
    if (err) {
      throw err;
    }
    if(row.verify == 0){
      var sql = "UPDATE record SET verify=? WHERE email=?";
      conn.run(sql, [1,email], function(err){
        if(err){
          throw err;
        }
        res.render('login', {layout: false, emailConfirmed: true});
      });
    }else{
      res.render('verified', {layout: false});
    }
  });
});

router.post('/login', function(req, res){
  session = req.session; 

  if(session.UniqueID){
     res.redirect('/continue');
  }else{
    var email = req.body.email;
    var pwd = req.body.pwd;

    var sql = "SELECT id,email,password FROM record WHERE email='"+email+"' AND password='"+pwd+"'";
    conn.each(sql, function(err, row){
      if (err) {
        throw err;
      }
      if(row){
        if(email == row.email && pwd == row.password){
          session.UniqueID = row.id;
          res.redirect('/continue');
        }else{
          res.render('login', {layout: false, loginError: true});
        }
      }else{
        res.render('login', {layout: false, loginError: true});
      }
    });
  }
});

router.post('/update', function(req, res, next){
  var details = req.body;
  let state;
  let lg;

  let rawdata = fs.readFileSync('public/javascripts/state-lg.json');  
  let myJSON = JSON.parse(rawdata); 

  for(var i in myJSON){
    if(myJSON[i].state.id == details.state){
      state = myJSON[i].state.name;
      for(var j in myJSON[i].state.locals){
        if(myJSON[i].state.locals[j].id == details.local){
          lg = myJSON[i].state.locals[j].name;
        }
      }
    }
  }

  var sql = "UPDATE record SET state=?,local=?,dob=?,place=? WHERE id=?";

  conn.run(sql, [state,lg,details.dob,details.place,session.UniqueID], function(err){
    if(err){
      throw err;
    }
    res.redirect('/continue');
  });
});

router.post('/update-img', upload.single('profile_photo'), function(req, res, next){
  var img = req.file;

  fs.readFile(img.path, function(err, data){
    if(err){
      throw err;
    }

    var sql = "UPDATE record SET image=? WHERE id=?";

    conn.run(sql, [data,session.UniqueID], function(err){
      if(err){
        throw err;
      }
      res.redirect('/main');
    });
  });
});

router.post('/changePass', function(req, res, next){
  var det = req.body;

  if(det.pwd == det.conPwd){
    var sql = "UPDATE record SET password=? WHERE id=?";

    conn.run(sql, [det.pwd,session.UniqueID], function(err){
      if(err){
        throw err;
      }
      res.redirect('/main');
    });
  }else{
    res.render('settings', {title: 'Identity Card - Settings', session: session.UniqueID, errr: true});
  }
});

module.exports = router;
