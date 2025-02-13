import React, { useEffect, useRef, useState } from 'react';
import 'chartjs-adapter-date-fns';
import { Chart, registerables } from 'chart.js';
import Papa from 'papaparse'; // Library for parsing CSV data
import "../styles/StockGraphs.css"
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { format, addDays } from 'date-fns'; // Import format and addDays from date-fns
import stockgraphicon from '../assets/stock-chart.svg';

const DefaultGraph = ({ selectStock, stockData, predict, predictDisplay }) => {
  const chartRef = useRef(null);
  const [selectedStockClosePrice, setSelectedStockClosePrice] = useState(0);

  useEffect(() => {
    // Find the selected stock data in stockData
    const selectedStock = stockData.find(stock => stock.name === selectStock);

    if (selectedStock) {
      setSelectedStockClosePrice(selectedStock.c); // Extract the close price for the selected stock
    }
  }, [selectStock, stockData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Construct URL based on the selected stock
        const response = await fetch(`./src/assets/csv/${selectStock}_stock_data.csv`);
        const csvData = await response.text(); // Get CSV data as text
        const parsedData = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true, // Skip empty lines
          transform: (value, header) => {
            // Convert 'Close' values to numbers
            if (header === 'Close') {
              return Number(value);
            }
            return value;
          }
        }).data;

        // Extracting data from the prediction
        const dates = parsedData.map(item => item.Date);
        const closePrices = parsedData.map(item => parseFloat(item.Close));

        // Prepare label array
        const labels = [...dates];
        // Add current date label
        const today = new Date();
        labels.push(format(today, 'yyyy-MM-dd')); // Today's date
        // Add tomorrow's date label if predictDisplay is true
        if (predictDisplay) {
          const tomorrow = addDays(today, 1); // Tomorrow's date
          labels.push(format(tomorrow, 'yyyy-MM-dd'));
        }

        // Prepare data array for prediction line
        const predictionData = Array(labels.length - 1).fill(null); // Fill array with null for existing dates
        if (predictDisplay && predict) {
          predictionData.push(predict); // Push prediction for the last date
        } else {
          predictionData.push(null); // Push null if no prediction available
        }

        // Destroy previous chart instance if exists
        if (chartRef.current) {
          chartRef.current.destroy();
        }

        Chart.register(...registerables);
        const ctx = document.getElementById('chart').getContext('2d');
        chartRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Close Price',
                data: [...closePrices, selectedStockClosePrice],
                borderColor: 'rgba(75, 192, 192, 1)', // Close price line color
                backgroundcolor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
              },
              {
                label: 'Prediction',
                data: predictionData,
                borderColor: 'rgba(255, 99, 132, 1)', // Prediction line color
                backgroundcolor: 'rgba(255, 99, 132, 1)',
                tension: 0.1
              }
            ]
          },
          options: {
            plugins: {
              title: {
                display: true,
                text: 'Stock Price Trend',
                font: {
                  size: 16
                }
              },
              legend: {
                display: true,
                position: 'bottom'
              }
            },
            scales: {
              x: {
                type: 'time',
                title: {
                  display: true,
                  text: 'Date'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Close Price'
                }
              }
            }
          }
        });
      } catch (error) {
        console.error('Error fetching or parsing data:', error);
      }
    };

    fetchData();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [selectStock, stockData, predict, selectedStockClosePrice, predictDisplay]);

  return (
    <div className="graph-container">
      <canvas id="chart" className='graph' />
    </div>
  );
};

const StockGraphs = ({ selectStock, stockData, predictDisplay }) => {
  const [predict, setPredict] = useState();

  useEffect(() => {
    if (selectStock) {
      getPredictions();
    }
  }, [selectStock]);

  const getPredictions = async () => {
      try {
        const tomorrow = addDays(new Date(), 1); // Tomorrow's date
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
    
        const userRef = doc(db, 'Prediction', formattedDate);
        const userDoc = await getDoc(userRef);
    
        if (userDoc.exists()) {
          const predictions = userDoc.data();
          if (predictions[selectStock]) {
            // Extract the prediction value for the selected stock ticker
            const predictionValue = predictions[selectStock];
            setPredict(predictionValue);
          } else {
            setPredict();
            console.log(`No prediction found for ${selectStock}`);
          }
        } else {
          setPredict();
          console.log('Prediction document does not exist');
        }
      } catch (error) {
        console.error('Error fetching predictions:', error);
      }
    };

  return (
    <div className="StockGraph-container">
      <h1>{selectStock}'s Graph</h1>
      <h3>Tomorrow's prediction is {predict}</h3>
      <div className='StockGraph-graph'>
        <DefaultGraph selectStock={selectStock} stockData={stockData} predict={predict} predictDisplay={predictDisplay} />
      </div>
    </div>
  );
};

export default StockGraphs;
