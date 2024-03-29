import React, { useState, useEffect } from 'react';
import * as FaIcons from 'react-icons/fa';
import { IconContext } from 'react-icons';
// import jwt_decode from "jwt-decode";
import { clearLocalStorage, getToken } from '../utilities/localStorageUtils';
// import axios from 'axios';
// import convert from 'htmr';
import Badge from '@material-ui/core/Badge';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import config from '../config/config';
import jwt_decode from "jwt-decode";
import Tooltip from '@material-ui/core/Tooltip';
import useComponentVisible from '../hooks/useComponentVisible';

interface Props {
    rerender?: boolean;
};

const Header: React.FC<Props> = ({ rerender }) => {

    // https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
    // This will allow us to dynamically assign properties to object in typescript
    interface LooseObject {
        [key: string]: any
    };

    // const token: string | null = getToken();
    // const decodedToken: LooseObject = jwt_decode(token as string); // as string / ! = non null assertion, to tell typescript that getToken will not return null
    // const username: string = decodedToken.username;

    const history = useHistory();
    const token: string | null = getToken();
    const toastTiming = config.toastTiming;
    let accountID: string;
    if (token) {
        const decodedToken: LooseObject = jwt_decode(token!);
        accountID = decodedToken.account_id;
    }

    // State declaration
    const [isProfilePopUpOpen, setIsProfilePopUpOpen] = useState<boolean>(false);
    const [isCartUsed, setIsCartUsed] = useState<boolean>(false);
    const { ref } = useComponentVisible(isProfilePopUpOpen, setIsProfilePopUpOpen);

    useEffect(() => {
        let componentMounted = true;

        if (token) {
            axios.get(`${config.baseUrl}/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then((res) => {
                    console.log(res);
                    const data = res.data;
                    if (componentMounted) {
                        if (data.cart.length !== 0) {
                            setIsCartUsed(() => true);
                        } else {
                            setIsCartUsed(() => false);
                        }
                    }
                })
                .catch((err) => {
                    console.log(err);
                    if (componentMounted) {
                        setIsCartUsed(() => false);
                    }
                });
        }

        return (() => {
            componentMounted = false;
        });
    }, [rerender]);

    // Handler
    const handleProfilePicClick = (): void => {
        setIsProfilePopUpOpen((prevState) => !prevState);
    };

    const handleLogOutClick = (): void => {
        console.log("testing");
        clearLocalStorage();
        history.push("/login");
        setTimeout(() => {
            toast.success('Successfully logged out!');
        }, 0);
    };

    return (
        <header>
            <div className="c-Header">
                {/* Left section */}
                <div className="c-Header__Left">
                    <div className="c-Logo">
                        <NavLink to="/products">Stripe Donut</NavLink>
                    </div>
                </div>
                {/* Right section */}
                <div className="c-Header__Right">
                    <div className="c-Header__Links">
                        <NavLink to="/products">Products</NavLink>
                        <NavLink to="/membership">Membership</NavLink>
                    </div>
                    <div className="c-Header__Icons">
                        <div className="c-Header__Cart">
                            <Tooltip title="Cart" arrow>
                                <NavLink to="/cart">
                                    <Badge color="secondary" variant="dot" invisible={!isCartUsed}>
                                        <IconContext.Provider value={{ color: "black", size: "21px" }}>
                                            <FaIcons.FaShoppingCart />
                                        </IconContext.Provider>
                                    </Badge>
                                </NavLink>
                            </Tooltip>

                        </div>
                        <div className="c-Header__Account" ref={ref}>
                            <Tooltip title="Account" arrow>
                                <div className="c-Header__Avatar" onClick={handleProfilePicClick}></div>
                            </Tooltip>
                            {
                                isProfilePopUpOpen ?
                                    token ? 
                                    <div className="l-Header__Profile-pop-up" >
                                        <div className="c-Header__Profile-pop-up">
                                            <button onClick={() => history.push("/account")}>My Account</button>
                                            <hr />
                                            <button onClick={handleLogOutClick}>Log out</button>
                                        </div>
                                    </div>
                                    :
                                    <div className="l-Header__Profile-pop-up" >
                                        <div className="c-Header__Profile-pop-up">
                                            <button onClick={() => history.push("/login")}>Login</button>
                                        </div>
                                    </div>
                                    :
                                    null
                            }
                        </div>
                    </div>

                </div>
            </div>

        </header>
    )
}

export default Header;