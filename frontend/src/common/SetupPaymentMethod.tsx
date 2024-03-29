import React, { useState, useEffect } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { getToken } from '../utilities/localStorageUtils';
import axios from 'axios';
import jwt_decode from "jwt-decode";
import config from '../config/config';
import Spinner from 'react-bootstrap/Spinner'

interface Props {
    show: boolean;
    handleClose: Function;
    setRerender: Function;
}

interface LooseObject {
    [key: string]: any
}

const SetupPaymentMethod: React.FC<Props> = ({ show, handleClose, setRerender }) => {

    const [cardSetupError, setCardSetupError] = useState<string | null>(null);
    const [cardSetupProcessing, setCardSetupProcessing] = useState(false);
    const [cardSetupDisabled, setCardSetupDisabled] = useState(true);
    const [cardSetupSuccess, setCardSetupSuccess] = useState<boolean>(false);
    const [setupIntentID, setSetupIntentID] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const token: string | null = getToken();
    let accountID: string;
    if (token) {
        const decodedToken: LooseObject = jwt_decode(token!);
        accountID = decodedToken.account_id;
    }


    useEffect(() => {
        let componentMounted = true;

        (async () => {
            try {
                if (componentMounted) {
                    // Retrieve client secret here
                    const setupIntent: LooseObject | null = await axios.post(`${config.baseUrl}/stripe/setup_intents`, {}, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    setClientSecret(() => setupIntent!.data.clientSecret);
                    setSetupIntentID(() => setupIntent!.data.paymentIntentID);
                }
            } catch (error) {
                console.log(error);
            }
        })()

        return (() => {
            componentMounted = false;
        });
    }, [show]);

    const stripe = useStripe();
    const elements = useElements();

    const showHideClassName = show ? "l-Setup-payment-method l-Setup-payment-method--show" : "l-Setup-payment-method l-Setup-payment-method--hidden";

    const CARD_ELEMENT_OPTIONS = {
        hidePostalCode: true,
        style: {
            base: {
                color: "#32325d",
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: "antialiased",
                fontSize: "16px",
                "::placeholder": {
                    color: "#32325d",
                }
            },
            invalid: {
                color: "#fa755a",
                iconColor: "#fa755a"
            }
        },
    };

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        elements!.getElement(CardElement)!.update({ disabled: true });
        setCardSetupProcessing(() => true);
        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
        }

        const result = await stripe.confirmCardSetup(clientSecret!, {
            payment_method: {
                card: elements.getElement(CardElement)!
            },
        });

        if (result.error) {
            setCardSetupError(() => result.error.message as string | null);
            setCardSetupProcessing(() => false);
            // Display result.error.message in your UI.
            elements!.getElement(CardElement)!.update({ disabled: false });
        } else {
            // The setup has succeeded. Display a success message and send
            // result.setupIntent.payment_method to your server to save the
            // card to a Customer

            // Obtain payment method id
            const stripePaymentMethodID = result.setupIntent.payment_method;

            // Verify stripePaymentMethod fingerprint doesn't already exist
            try {
                const verifyPaymentMethodDuplicate = await axios.post(`${config.baseUrl}/stripe/verify_payment_method_setup`, {
                    stripePaymentMethodID
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (verifyPaymentMethodDuplicate.data.duplicate) {
                    setCardSetupError(() => "Error! Card already exists!");
                    elements!.getElement(CardElement)!.update({ disabled: false });
                    setCardSetupProcessing(() => false);

                } else {
                    elements!.getElement(CardElement)!.clear();
                    setRerender((prevState: any) => !prevState);    // tell parent component to rerender to see changes
                    setCardSetupSuccess(() => true);
                    setCardSetupProcessing(() => false);
                    setCardSetupError(() => null);
                }
            } catch (error) {
                console.log(error);
                elements!.getElement(CardElement)!.update({ disabled: false });
                setCardSetupError(() => "Error! Please try again later!");
            }

        }
    };

    const handleBtn = () => {
        // Clear stripe element before closing
        if (elements?.getElement(CardElement)) {
            elements!.getElement(CardElement)!.clear();
        }
        handleClose();
    };

    const handleCardInputChange = async (event: any) => {
        // Listen for changes in the CardElement
        // and display any errors as the customer types their card details

        if (event.complete) {
            setCardSetupDisabled(() => false);
        } else {
            setCardSetupDisabled(() => true);
        }

        setCardSetupError(event.error ? event.error.message : "");
    };

    return (
        <form className={showHideClassName} onSubmit={(event) => handleSubmit(event)}>
            {
                cardSetupSuccess ?
                    <div className="c-Setup-payment-method c-Setup-payment-method__Success">
                        <span>
                            <svg viewBox="0 0 24 24">
                                <path strokeWidth="2" fill="none" stroke="#ffffff" d="M 3,12 l 6,6 l 12, -12" />
                            </svg>
                        </span>
                        <h1>Card Added Successfully!</h1>
                        <button type="button" className="c-Btn c-Btn--link" onClick={() => handleBtn()}>Close</button>
                    </div>
                    :

                    <div className="c-Setup-payment-method">
                        <h1>Add Payment Method</h1>
                        <div className="l-Setup-payment-method__Card-element">
                            <div className={cardSetupProcessing ? "c-Setup-payment-method__Card-element c-Setup-payment-method__Card-element--disabled" : "c-Setup-payment-method__Card-element"}>
                                {/* Card input is rendered here */}
                                <CardElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardInputChange} />
                            </div>
                        </div>
                        {/* Show any error that happens when setting up the payment method */}
                        {cardSetupError && (
                            <div className="card-error" role="alert">
                                {cardSetupError}
                            </div>
                        )}
                        <div className="c-Setup-payment-method__Btn">
                            <button disabled={cardSetupProcessing || cardSetupDisabled} type="button" className={cardSetupProcessing || cardSetupDisabled ? "c-Btn c-Btn--disabled" : "c-Btn"}onClick={(event) => handleSubmit(event)}>
                                {cardSetupProcessing ? (
                                    <>
                                        <span> Processing </span>
                                        <Spinner animation="border" role="status" />
                                    </>
                                ) : (
                                    <>
                                        Save
                                    </>
                                )}
                            </button>
                            <button disabled={cardSetupProcessing} type="button" className="c-Btn c-Btn--link" onClick={() => handleBtn()}>Cancel</button>
                        </div>
                    </div>


            }
        </form>


    )
}

export default SetupPaymentMethod;