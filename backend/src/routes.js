// CONTROLLERS
const accountController = require("./controllers/account");
const authController = require("./controllers/auth");
const cartController = require("./controllers/cart");
const productController = require("./controllers/product");
const membershipController = require("./controllers/membership");
const stripeController = require("./controllers/stripe");
const ordersController = require("./controllers/orders");

// MIDDLEWARES
const { isLoggedIn } = require("./middlewares/login");
const { calculateProductsTotalPrice } = require("./middlewares/payment");
const { verifyStripeWebhookRequest } = require("./middlewares/access");

module.exports = router => {

    // Default URL check
    router.get("/", (req, res) => {
        res.status(200).send("안녕하세요~! Donut store api is functioning properly");
    })

    // WEBHOOKS
    router.post("/api/v1/webhooks/stripe", verifyStripeWebhookRequest, stripeController.handleWebhook);

    // LOGIN
    router.post("/api/v1/login", authController.clientLogin);

    // STRIPE PAYMENT
    // With reference to https://stripe.com/docs/payments/integration-builder
    // & https://stripe.com/docs/api/payment_intents
    router.post("/api/v1/stripe/payment_intents", isLoggedIn, calculateProductsTotalPrice, stripeController.createPaymentIntent);
    router.put("/api/v1/stripe/payment_intents", isLoggedIn, calculateProductsTotalPrice, stripeController.updatePaymentIntent);
    router.get("/api/v1/stripe/payment_methods/:stripeCustomerID", isLoggedIn, stripeController.findStripeCustomerPaymentMethods);
    router.post("/api/v1/stripe/setup_intents", isLoggedIn, stripeController.createSetupIntent);
    router.post("/api/v1/stripe/verify_payment_method_setup", isLoggedIn, stripeController.verifyPaymentMethodSetup); // check if there's duplicate payment method
    router.post("/api/v1/stripe/subscriptions/:type", isLoggedIn, stripeController.createSubscription);
   
    // ACCOUNT
    router.get("/api/v1/account/:accountID", isLoggedIn, accountController.findAccountByID);
    
    // ORDERS
    router.post("/api/v1/orders", isLoggedIn, calculateProductsTotalPrice, ordersController.insertOrder);

    // PRODUCTS
    router.get("/api/v1/products", productController.findAllProducts);
    router.get("/api/v1/product/:productID", productController.findProductByProductID);

    // CART
    router.get("/api/v1/cart", isLoggedIn, cartController.findCartItemsByAccountID);
    router.get("/api/v1/cart/:productID", isLoggedIn, cartController.findCartItemByAccountIDAndProductID);
    router.post("/api/v1/cart", isLoggedIn, cartController.insertCartItem);
    router.put("/api/v1/cart", isLoggedIn, cartController.updateCartItem);
    router.delete("/api/v1/cart/:productID", isLoggedIn, cartController.deleteCartItem);
    router.delete("/api/v1/cart", isLoggedIn, cartController.deleteAllCartItemByAccountID);

    // MEMBERSHIP
    router.get("/api/v1/memberships", membershipController.findAllMemberships);
    router.get("/api/v1/membership/:type", membershipController.findMembership);
};