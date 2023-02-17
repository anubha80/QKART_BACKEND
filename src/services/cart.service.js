const httpStatus = require("http-status");
const { Cart, Product, User } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

const {getProductById} = require("./product.service")


// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const userEmail=user.email;
  const cartDetail= await Cart.findOne({email:userEmail});
  if(!cartDetail){
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  return cartDetail;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
// const addProductToCart = async (user, productId, quantity) => {
//   let email=user.email;
  
//     const userCartExists = await Cart.findOne({email:email});
//     // cart exixts
//     if(userCartExists){
//       // check if product already in cart
//       for(let i=0;i<userCartExists.cartItems.length;i++){
//         if(userCartExists.cartItems[i].product._id == productId){
//           throw new ApiError(httpStatus.BAD_REQUEST, "Product already in cart. Use the cart sidebar to update or remove product from cart");
//         }
//       }
//       // check if product exists in database
//       let getNewProductDetails = await getProductById(productId);
//       if(!getNewProductDetails){
//         throw new ApiError(httpStatus.BAD_REQUEST,"Product doesn't exist in database");
//       }
//       // add new product to cart
//       userCartExists.cartItems.push({product:getNewProductDetails, quantity:quantity});
//       userCartExists.save();
//       return userCartExists;
//     }
//     // cart does not exists
//     const productDetails = await getProductById(productId);
//     const cartResult=await Cart.create({email:email, cartItems:[{product: productDetails, quantity:quantity}]});
//     if(!cartResult){
//       throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Could not create cart for user");
//     }
//     return cartResult;
// };
const addProductToCart = async (user, productId, quantity) => {
  const productDetails = await Product.findOne({ _id: productId });

  //this works
  if (!productDetails) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }

  const cartDetailsByEmail = await Cart.findOne({ email: user.email });

  //new record created -works
  if (!cartDetailsByEmail) {
    const firstCartCreated = await Cart.create({
      email: user.email,
      cartItems: [{ product: productDetails, quantity: quantity }],
      paymentOption: config.default_payment_option,
    });
    if (!firstCartCreated) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "500 Internal Server Error"
      );
    }
    return firstCartCreated;
  }

  const productExist = cartDetailsByEmail.cartItems.filter((element) => {
    {
      return String(element.product._id) === productId;
    }
  });

  // console.log(productExist);
  // console.log("cartDetailsByEmail",cartDetailsByEmail.cartItems);
  //this product exits works
  if (productExist.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product already in cart. Use the cart sidebar to update or remove product from cart"
    );
  } else {
    cartDetailsByEmail.cartItems.push({
      product: productDetails,
      quantity: quantity,
    });
    const addProductToExistingCart = await cartDetailsByEmail.save();
    return addProductToExistingCart;
  }
};


/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  try{
    if(quantity===0){
      const getUserCart = await deleteProductFromCart(user, productId);
      return getUserCart;
    }
    // check if cart exist
    const getUserCart = await Cart.findOne({ email: user.email });
    // console.log(" @@@@ ---- ", getUserCart);
    if(!getUserCart){
      throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart. Use POST to create cart and add a product");
    }
    // check if product exist in db
    let getNewProductDetails = await getProductById(productId);
    if(!getNewProductDetails){
      throw new ApiError(httpStatus.BAD_REQUEST,"Product doesn't exist in database");
    }
    // check if product to update exist in cart
    let productFoundInCart=false;
    for(let i=0;i<getUserCart.cartItems.length;i++){
      if(getUserCart.cartItems[i].product._id == productId){
        productFoundInCart=true;
        getUserCart.cartItems[i].quantity=quantity;
        getUserCart.save();
      }
    }
    // if product not in cart
    if(!productFoundInCart){
      throw new ApiError(httpStatus.BAD_REQUEST,"Product not in cart");
    }
    return getUserCart;
  }
  catch(error){
    throw error;
  }
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  const getUserCart = await Cart.findOne({ email: user.email });
    // cart does not exist
    if(!getUserCart){
      throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart.");
    }
    let productFoundInCart=false;
    for(let i=0;i<getUserCart.cartItems.length;i++){
      if(String(getUserCart.cartItems[i].product._id) == String(productId)){
        productFoundInCart=true;
        getUserCart.cartItems.splice(i,1);
        getUserCart.save();
      }
    }
    // if product not in cart
    if(!productFoundInCart){
      throw new ApiError(httpStatus.BAD_REQUEST,"Product not in cart");
    }
    return getUserCart;
};

// };

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
  const getUserCart = await Cart.findOne({ email: user.email });

  // check cart exists
  if(!getUserCart){
    throw new ApiError(httpStatus.NOT_FOUND,"User does not have a cart");
  }
  // check cart is empty or not
  if(getUserCart.cartItems.length<1){
    throw new ApiError(httpStatus.BAD_REQUEST,"User does not have any product in cart");
  }
  // check address set
  const isAddressSet = await user.hasSetNonDefaultAddress();
  if(!
    isAddressSet){
    throw new ApiError(httpStatus.BAD_REQUEST,"Address is not set");
  }
  // check wallet balance
  let totalCartAmount = 0;
  for(let i=0;i<getUserCart.cartItems.length;i++){
    totalCartAmount=totalCartAmount+getUserCart.cartItems[i].quantity*getUserCart.cartItems[i].product.cost;
  }
  if(user.walletMoney<totalCartAmount){
    throw new ApiError(httpStatus.BAD_REQUEST,"Insufficient balance in wallet");
  }
  // update user balance and empty cart
  const updatedWalletMoney = user.walletMoney-totalCartAmount;
  user.walletMoney=updatedWalletMoney;
  user.save();

  while(getUserCart.cartItems.length>0){
    getUserCart.cartItems.splice(0,1);
  }
  getUserCart.save();
};


module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
