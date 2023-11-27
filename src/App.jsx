import React from "react";
import LineChart from "./LineChart";
import LineChartSlope from "./LineChartSlope";
import './App.css'

const App = () => {
  return (
    <>
      <div className="types">
        <div className="delta">Delta</div>
        <div className="delta7">Delta7</div>
      </div>
      <div className="container">
        <LineChart />
        <LineChartSlope />
      </div>
    </>
  );
};

export default App;


