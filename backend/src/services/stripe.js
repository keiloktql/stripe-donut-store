const config = require("../config/config");

// Test secret API Key
const stripe = require("stripe")(config.stripe.test.sk);

// Create payment intent
module.exports.createPaymentIntent = (totalPrice) => stripe.paymentIntents.create({
    amount: totalPrice,
    currency: "sgd"
});

// Create customer
module.exports.createStripeCustomer = (email, name) => stripe.customers.create({
    email,
    name
});

module.exports.findStripeCustomerPaymentMethods = (stripeCustomerID) => stripe.paymentMethods.list({
  customer: stripeCustomerID,
  type: 'card'
});