import React, { useEffect, useState } from 'react';
import './App.css';
import { countryList } from './country_list';

function App() {
  const [selectedCountries, setSelectedCountries] = useState([]);

  // URLクエリから状態を復元
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const countries = params.get('countries');
    if (countries) {
      setSelectedCountries(countries.split(','));
    }
  }, []);

  // URL更新
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCountries.length > 0) {
      params.set('countries', selectedCountries.join(','));
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedCountries]);

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

    function drawRegionsMap() {
      const data = window.google.visualization.arrayToDataTable([
        ['Country', 'Popularity'],
        ...selectedCountries.map((c) => [c, 1000]),
      ]);

      const options = {
        colorAxis: { colors: ['#e0e0e0', '#ff5252'] },
        legend: 'none',
      };

      const chart = new window.google.visualization.GeoChart(
        document.getElementById('regions_div')
      );

      window.google.visualization.events.addListener(chart, 'regionClick', (e) => {
        const clickedCode = e.region;
        setSelectedCountries((prev) =>
          prev.includes(clickedCode)
            ? prev.filter((c) => c !== clickedCode)
            : [...prev, clickedCode]
        );
      });

      chart.draw(data, options);
    }
  }, [selectedCountries]);

  const handleCheckboxChange = (code) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const level = selectedCountries.length;

  return (
    <div className="app-container">
      <h1 className="app-title">Visited Countries Map</h1>
      <p className="level-label">Level: {level}</p>
      <div id="regions_div" className="geo-chart"></div>

      <div className="checkbox-list">
        {Object.entries(countryList).map(([region, countries]) => (
          <div key={region}>
            <h3>{region}</h3>
            {countries.map(({ code, name }) => (
              <label key={code} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(code)}
                  onChange={() => handleCheckboxChange(code)}
                />
                {name}
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
