// src/App.js
import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [clickedCountries, setClickedCountries] = useState([]);

  // 初回にURLからクエリを読み込む
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const countries = params.get('countries');
    if (countries) {
      setClickedCountries(countries.split(','));
    }
  }, []);

  // URLを更新（状態が変わるたび）
  useEffect(() => {
    const params = new URLSearchParams();
    if (clickedCountries.length > 0) {
      params.set('countries', clickedCountries.join(','));
      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    } else {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [clickedCountries]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      window.google.charts.load('current', {
        packages: ['geochart'],
      });
      window.google.charts.setOnLoadCallback(drawRegionsMap);
    };
    document.body.appendChild(script);

    function drawRegionsMap() {
      const data = window.google.visualization.arrayToDataTable([
        ['Country', 'Popularity'],
        ...clickedCountries.map(country => [country, 1000])
      ]);

      const options = {
        colorAxis: { colors: ['#e0e0e0', '#ff5252'] },
        legend: 'none'
      };

      const chart = new window.google.visualization.GeoChart(
        document.getElementById('regions_div')
      );

      window.google.visualization.events.addListener(chart, 'regionClick', (e) => {
        setClickedCountries(prev =>
          prev.includes(e.region) ? prev : [...prev, e.region]
        );
      });

      chart.draw(data, options);
    }
  }, [clickedCountries]);

  return (
    <div className="app-container">
      <h1 className="app-title">Visited Countries Map</h1>
      <div id="regions_div" className="geo-chart"></div>
    </div>
  );
}

export default App;
