import React, { useEffect } from 'react';
import './App.css';

function App() {
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

    window.addEventListener('popstate', drawRegionsMap);
  }, []);

  function getCountriesFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const countries = params.get('countries');
    return countries ? countries.split(',') : [];
  }

  function updateUrl(countries) {
    const params = new URLSearchParams();
    if (countries.length > 0) {
      params.set('countries', countries.join(','));
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  }

  function drawRegionsMap() {
    const clickedCountries = getCountriesFromUrl();

    const data = window.google.visualization.arrayToDataTable([
      ['Country', 'Popularity'],
      ...clickedCountries.map((country) => [country, 1000]),
    ]);

    const options = {
      colorAxis: { colors: ['#e0e0e0', '#ff5252'] },
      legend: 'none',
    };

    const chart = new window.google.visualization.GeoChart(
      document.getElementById('regions_div')
    );

    window.google.visualization.events.addListener(chart, 'regionClick', (e) => {
      let countries = getCountriesFromUrl();
      if (countries.includes(e.region)) {
        countries = countries.filter((c) => c !== e.region); // 削除
      } else {
        countries.push(e.region); // 追加
      }
      updateUrl(countries);
      drawRegionsMap(); // 再描画
    });

    chart.draw(data, options);
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Visited Countries Map</h1>
      <div id="regions_div" className="geo-chart"></div>
    </div>
  );
}

export default App;
