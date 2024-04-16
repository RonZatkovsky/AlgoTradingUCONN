import React, { useState, useEffect } from 'react';
import "../styles/Stats.css"
import axios from "axios";
import StatsRow from './StatsRow';
// import { db } from '../services/firebase';
// import { doc, getDoc } from "firebase/firestore";
import moneyicon from '../assets/money-icon.svg';
import listicon from '../assets/list-icon.svg';

const TOKEN = "cnd3ll1r01qr85dtaltgcnd3ll1r01qr85dtalu0";
const BASE_URL = "https://finnhub.io/api/v1/quote";

export const getStockData = async (stock) => {
  return axios
    .get(`${BASE_URL}?symbol=${stock}&token=${TOKEN}`)
    .catch((error) => {
      console.error("Error", error.message);
    });
};

function Stats({ stockData, user_portfolio }) {
  
  return (
    <div className="stats">
      <div className="stats__container">
        <div className="stats__header">
          <p> <img src={moneyicon} alt="Stock Graph Icon" className="money__icon" />
          My Stocks</p>
        </div>
        <div className="stats__content">
          <div className="stats__rows">
           {user_portfolio.map((stock) => (
            <StatsRow
              key={stock.ticker}
              name={stock.ticker}
              openPrice={stock.info.o}
              volume={stock.numShares}
              price={stock.info.c}
            />
           ))}
          </div>
        </div>
        
        <div className="stats__header stats__lists">
          <p> <img src={listicon} alt="Stock Graph Icon" className="list__icon" />Listed Stocks</p>
        </div>
        <div className="stats__content">
          <div className="stats__rows">
            {stockData.map((stock) => (
              <StatsRow
                key={stock.name}
                name={stock.name}
                openPrice={stock.o}
                price={stock.c} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stats;