import React, { useEffect, useState } from 'react';
import { countryList } from './country_list';

import './App.css';

function App() {
  const [level, setLevel] = useState(0);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      window.google.charts.load('current', {
        packages: ['geochart'],
      });
      window.google.charts.setOnLoadCallback(() => {
        setScriptLoaded(true);
        drawRegionsMap();
      });
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
    if (!window.google || !window.google.visualization) return;

    const clickedCountries = getCountriesFromUrl();
    setLevel(clickedCountries.length);

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
        countries = countries.filter((c) => c !== e.region);
      } else {
        countries.push(e.region);
      }
      updateUrl(countries);
      drawRegionsMap();
    });

    chart.draw(data, options);
  }

  const handleCheckboxChange = (code) => {
    let countries = getCountriesFromUrl();
    if (countries.includes(code)) {
      countries = countries.filter((c) => c !== code);
    } else {
      countries.push(code);
    }
    updateUrl(countries);
    drawRegionsMap();
  };

  const selectedCountries = getCountriesFromUrl();

  return (
    <div className="app-container">
      <h1 className="app-title">Visited Countries Map</h1>
      <p className="level-label">Level: {level}</p>
      <div id="regions_div" className="geo-chart"></div>

      <div className="checkbox-list">
        {countryList.map(({ code, name }) => (
          <label key={code} className="checkbox-item">
            <input
              type="checkbox"
              checked={selectedCountries.includes(code)}
              onChange={() => handleCheckboxChange(code)}
            />
            {code}
          </label>
        ))}
      </div>
    </div>
  );
}

export default App;
