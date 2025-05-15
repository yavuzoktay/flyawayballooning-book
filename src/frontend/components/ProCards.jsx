import { Button } from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";

const ProCards = ({ title, subTitle, Image, btnText, clickHandler }) => {
    return (

        <Link>
            <div className="card-final-wrap" onClick={clickHandler}>
                <div className="card-img-wrap">
                    <img src={Image} alt={title} />
                </div>
                <div className="card-cont-wrap">
                    <div className="card-cont-final-wrap">
                        <h2>{title}</h2>
                        <p>{subTitle}</p>
                    </div>
                    <div className="card-cont-btn-wrap">
                        <Button onClick={clickHandler}>{btnText}</Button>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default ProCards;