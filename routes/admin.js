
var express = require("express");
var router = express.Router();
var product = require("../helpers/product-helpers");
const user = require("../helpers/user-helpers")

// const isAdmin=(req,res,next)=>{
//   if(req.session.role===0){
//     next()
//   }
//   res.render('Admin/login',{admin:true})
// }
router.get("/admin",(req, res) => {
  let user=req.session.user
  let role=req.session.role
  if(user){
    if(role==0){
  res.render('Admin/index',{admin:true})
  }
}else{
    res.render("Admin/adminLogin");
  }
});
router.get('/dashboard',(req,res)=>{
  let user=req.session.user
  let role=req.session.role
  if(user){
    if(role==0){
  res.render('Admin/index',{admin:true})
  }
}else{
    res.render("Admin/adminLogin");
  }
})

router.get("/addProduct",(req, res) => {
  product.getAllCategory().then((category) => {
    res.render("Admin/addProduct", { category,admin:true });
  });
});

router.post("/addNewProduct", (req, res) => {
  product.addProduct(req.body,(id)=>{
    let image = req.files.Image
    console.log(image);
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.redirect('./addProduct')
      }
      else{
        console.log("Error in adding Image");
      }
    })
  })
});

router.get("/addCategory", (req, res) => {
  product.getAllCategory().then((category) => {
    res.render("Admin/addCategory", { category,admin:true });
  });
});

router.post("/newCategory", (req, res) => {
    product.categoryExists(req.body).then((data)=>{
        res.send({ category: false });
    }).catch(()=>{
        product.addCategory(req.body).then(() => {
            res.send({ category: true });
          });
    })
});

router.post("/loginadmin", (req, res) => {
  user
    .userLogin(req.body)
    .then((response) => {
      req.session.isLoggedIn=true;
      req.session.role=response.user.role
      req.session.user=response.user
      console.log(response.user.role);
      if(req.session.role==0){
        res.send({user:true,role:true}) //admin
      }
      else{
      res.send({ user: true,role:false });//user
      }
    })
    .catch((response) => {
      res.send({ user: false });
    });
});

router.get('/delete/:id',(req,res)=>{
  let user=req.session.user
  let role=req.session.role
  if(user){
    if(role==0){
      product.deleteCatById(req.params.id).then(()=>{
        res.redirect('/addCategory')
      })
  }
}else{
    res.render("Admin/adminLogin");
  }
})
router.get('/logoutAdmin',(req,res)=>{
  req.session.destroy()
  res.redirect('/admin')
})
router.get('/edit/:id',(req,res)=>{
  let user=req.session.user
  let role=req.session.role
  if(user){
    if(role==0){
      res.render('/Admin/editCat')
  }
}else{
    res.render("Admin/adminLogin");
  }
})
module.exports = router;
