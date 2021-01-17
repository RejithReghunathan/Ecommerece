
var express = require("express");
var router = express.Router();
var product = require("../helpers/product-helpers");
const user = require("../helpers/user-helpers")


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
router.get('/deleteCat/:id',(req,res)=>{
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
router.get('/editCat/:id',(req,res)=>{
  let user=req.session.user
  let role=req.session.role
  if(user){
    if(role==0){
      product.getCategoryById(req.params.id).then((category)=>{
        res.render('Admin/editCat',{admin:true,category})
      })
  }
}else{
    res.render("Admin/adminLogin");
  }
})
router.post('/updateCat/:id',(req,res)=>{
  let user=req.session.user
  let role=req.session.role
  console.log("Name",req.body);
  if(user){
    if(role==0){
     product.UpdateCatById(req.body,req.params.id).then((response)=>{
       res.redirect('/addCategory')
     })
  }
}else{
    res.render("Admin/adminLogin");
  }
})
router.get('/products',(req,res)=>{
  let user=req.session.user
  let role=req.session.role
  if(user){
    if(role==0){
     product.getAllProduct().then((product)=>{
       res.render('Admin/product',{product,admin:true})
     })
  }
}else{
    res.render("Admin/adminLogin");
  }
})
router.get('/editProd/:id',(req,res)=>{
  console.log("REQ",req.params.id);
  let user=req.session.user
  let role=req.session.role
  if(user){
    if(role==0){
      product.getAllCategory().then((category) => {   
      product.getSingleProduct(req.params.id).then((product)=>{
        res.render('Admin/editProd',{product,admin:true,category})
      })
    });
  }
}else{
    res.render("Admin/adminLogin");
  }
})
router.post('/updateProduct/:id',(req,res)=>{
  let user=req.session.user
  let role=req.session.role
  if(user){
    if(role===0){
      product.updateProdById(req.body,req.params.id).then((data)=>{
        res.redirect('/products')
      })
  }
}else{
    res.render("Admin/adminLogin");
  }
})
router.get('/deleteProd/:id',(req,res)=>{
  let user=req.session.user
  let role=req.session.role
  if(user){
    if(role==0){
      product.deleteProdById(req.params.id).then(()=>{
        res.redirect('/products')
      })
  }
}else{
    res.render("Admin/adminLogin");
  }
})
module.exports = router;
