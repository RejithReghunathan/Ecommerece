var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.render('home')
});
router.get('/signup',(req,res)=>{
  res.render('register')
})
router.get('/login',(req,res)=>{
  res.render('login')
})

module.exports = router;
