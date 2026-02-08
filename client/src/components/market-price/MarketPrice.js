import React, { useState, useRef, Fragment } from 'react';
import { DATA_GOV_API_KEY } from '../../config';

const MarketPrice = () => {
  // Cache for API responses to prevent redundant calls
  const cacheRef = useRef({
    districts: {},
    markets: {},
    commodities: {},
    varieties: {},
    grades: {}
  });

  const [formData, setFormData] = useState({
    state: '',
    stateId: '',
    district: '',
    districtId: '',
    market: '',
    marketId: '',
    commodity: '',
    variety: '',
    grade: ''
  });

  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Hardcoded list of Indian states
  const INDIAN_STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal'
  ];

  const [filterOptions, setFilterOptions] = useState({
    states: INDIAN_STATES,
    districts: [],
    markets: [],
    commodities: [],
    varieties: [],
    grades: []
  });
  const [loadingFilters, setLoadingFilters] = useState({
    states: false,
    districts: false,
    markets: false,
    commodities: false,
    varieties: false,
    grades: false
  });

  const onChange = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'state') {
      setFormData(prev => ({ 
        ...prev, 
        state: value,
        stateId: value,
        district: '',
        districtId: '',
        market: '',
        marketId: '',
        commodity: '',
        variety: '',
        grade: ''
      }));
      
      // Reset all dependent fields
      setFilterOptions(prev => ({
        ...prev,
        districts: [],
        markets: [],
        commodities: [],
        varieties: [],
        grades: []
      }));
      
      // Fetch only districts for selected state
      if (value && value !== '') {
        await fetchDistricts(value);
      }
    } else if (name === 'district') {
      setFormData(prev => ({ 
        ...prev, 
        district: value,
        districtId: value,
        market: '',
        marketId: '',
        commodity: '',
        variety: '',
        grade: ''
      }));
      
      // Reset dependent fields
      setFilterOptions(prev => ({
        ...prev,
        markets: [],
        commodities: [],
        varieties: [],
        grades: []
      }));
      
      // Fetch only markets for selected district
      if (value && value !== '' && formData.state) {
        await fetchMarkets(value, formData.state);
      }
    } else if (name === 'market') {
      setFormData(prev => ({ 
        ...prev, 
        market: value,
        marketId: value,
        commodity: '',
        variety: '',
        grade: ''
      }));
      
      // Reset dependent fields
      setFilterOptions(prev => ({
        ...prev,
        commodities: [],
        varieties: [],
        grades: []
      }));
      
      // Fetch commodities for selected market
      if (value && value !== '' && formData.state && formData.district) {
        await fetchCommodities(formData.state, formData.district, value, '');
      }
    } else if (name === 'commodity') {
      setFormData(prev => ({ 
        ...prev, 
        commodity: value,
        variety: '',
        grade: ''
      }));
      
      // Reset dependent fields
      setFilterOptions(prev => ({
        ...prev,
        varieties: [],
        grades: []
      }));
      
      // Fetch only varieties for selected commodity
      if (value && value !== '' && formData.state && formData.district && formData.market) {
        await fetchVarieties(formData.state, formData.district, formData.market, value);
      }
    } else if (name === 'variety') {
      setFormData(prev => ({ 
        ...prev, 
        variety: value,
        grade: ''
      }));
      
      // Reset grades
      setFilterOptions(prev => ({
        ...prev,
        grades: []
      }));
      
      // Fetch grades for selected variety
      if (value && value !== '' && formData.state && formData.district && formData.market && formData.commodity) {
        await fetchGrades(formData.state, formData.district, formData.market, formData.commodity, value);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Fetch districts for a state from market price API
  const fetchDistricts = async (stateName) => {
    // Check cache first
    if (cacheRef.current.districts[stateName]) {
      setFilterOptions(prev => ({ ...prev, districts: cacheRef.current.districts[stateName] }));
      return;
    }

    setLoadingFilters(prev => ({ ...prev, districts: true }));
    try {
      const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_API_KEY}&format=json&limit=1000&offset=0&filters[state.keyword]=${encodeURIComponent(stateName)}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });
      
      const data = await res.json();
      
      // Extract records from response
      let allData = [];
      if (data.records && Array.isArray(data.records)) {
        allData = data.records;
      } else if (Array.isArray(data)) {
        allData = data;
      } else if (data.data && Array.isArray(data.data)) {
        allData = data.data;
      }
      
      // Extract unique district names
      const districtSet = new Set();
      allData.forEach(record => {
        if (record.district && record.district.trim()) {
          districtSet.add(record.district.trim());
        }
      });
      
      // Convert to sorted array
      const districts = Array.from(districtSet).sort();
      
      // Cache the result
      cacheRef.current.districts[stateName] = districts;
      
      console.log('Districts fetched:', districts.length);
      
      setFilterOptions(prev => ({ ...prev, districts: districts }));
    } catch (err) {
      console.error('Error fetching districts:', err);
      setFilterOptions(prev => ({ ...prev, districts: [] }));
    } finally {
      setLoadingFilters(prev => ({ ...prev, districts: false }));
    }
  };

  // Fetch markets from market price API
  const fetchMarkets = async (districtName, stateName) => {
    // Create cache key
    const cacheKey = `${stateName}|${districtName}`;
    if (cacheRef.current.markets[cacheKey]) {
      setFilterOptions(prev => ({ ...prev, markets: cacheRef.current.markets[cacheKey] }));
      return;
    }

    setLoadingFilters(prev => ({ ...prev, markets: true }));
    try {
      let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_API_KEY}&format=json&limit=1000&offset=0&filters[state.keyword]=${encodeURIComponent(stateName)}`;
      if (districtName) {
        url += `&filters[district]=${encodeURIComponent(districtName)}`;
      }
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });
      
      const data = await res.json();
      
      // Extract records from response
      let allData = [];
      if (data.records && Array.isArray(data.records)) {
        allData = data.records;
      } else if (Array.isArray(data)) {
        allData = data;
      } else if (data.data && Array.isArray(data.data)) {
        allData = data.data;
      }
      
      // Extract unique market names
      const marketSet = new Set();
      allData.forEach(record => {
        if (record.market && record.market.trim()) {
          marketSet.add(record.market.trim());
        }
      });
      
      // Convert to sorted array
      const markets = Array.from(marketSet).sort();
      
      // Cache the result
      cacheRef.current.markets[cacheKey] = markets;
      
      console.log('Markets fetched:', markets.length);
      
      setFilterOptions(prev => ({ ...prev, markets: markets }));
    } catch (err) {
      console.error('Error fetching markets:', err);
      setFilterOptions(prev => ({ ...prev, markets: [] }));
    } finally {
      setLoadingFilters(prev => ({ ...prev, markets: false }));
    }
  };

  // Fetch commodity options from market price API
  const fetchCommodities = async (stateName, districtName, marketName, varietyName) => {
    // Create cache key
    const cacheKey = `${stateName}|${districtName}|${marketName}|${varietyName}`;
    if (cacheRef.current.commodities[cacheKey]) {
      setFilterOptions(prev => ({ ...prev, commodities: cacheRef.current.commodities[cacheKey] }));
      return;
    }

    setLoadingFilters(prev => ({ ...prev, commodities: true }));
    try {
      let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_API_KEY}&format=json&limit=1000&offset=0&filters[state.keyword]=${encodeURIComponent(stateName)}`;
      if (districtName) {
        url += `&filters[district]=${encodeURIComponent(districtName)}`;
      }
      if (marketName) {
        url += `&filters[market]=${encodeURIComponent(marketName)}`;
      }
      if (varietyName) {
        url += `&filters[variety]=${encodeURIComponent(varietyName)}`;
      }
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });
      
      const data = await res.json();
      
      // Extract records from response
      let allData = [];
      if (data.records && Array.isArray(data.records)) {
        allData = data.records;
      } else if (Array.isArray(data)) {
        allData = data;
      } else if (data.data && Array.isArray(data.data)) {
        allData = data.data;
      }
      
      // Extract unique commodity names
      const commoditySet = new Set();
      allData.forEach(record => {
        if (record.commodity && record.commodity.trim()) {
          commoditySet.add(record.commodity.trim());
        }
      });
      
      // Convert to sorted array
      const commodities = Array.from(commoditySet).sort();
      
      // Cache the result
      cacheRef.current.commodities[cacheKey] = commodities;
      
      console.log('Commodities fetched:', commodities.length);
      
      setFilterOptions(prev => ({ ...prev, commodities: commodities }));
    } catch (err) {
      console.error('Error fetching commodities:', err);
      setFilterOptions(prev => ({ ...prev, commodities: [] }));
    } finally {
      setLoadingFilters(prev => ({ ...prev, commodities: false }));
    }
  };

  // Fetch variety options from market price API
  const fetchVarieties = async (stateName, districtName, marketName, commodityName) => {
    // Create cache key
    const cacheKey = `${stateName}|${districtName}|${marketName}|${commodityName}`;
    if (cacheRef.current.varieties[cacheKey]) {
      setFilterOptions(prev => ({ ...prev, varieties: cacheRef.current.varieties[cacheKey] }));
      return;
    }

    setLoadingFilters(prev => ({ ...prev, varieties: true }));
    try {
      let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_API_KEY}&format=json&limit=1000&offset=0&filters[state.keyword]=${encodeURIComponent(stateName)}&filters[district]=${encodeURIComponent(districtName)}&filters[market]=${encodeURIComponent(marketName)}&filters[commodity]=${encodeURIComponent(commodityName)}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });
      
      const data = await res.json();
      
      // Extract records from response
      let allData = [];
      if (data.records && Array.isArray(data.records)) {
        allData = data.records;
      } else if (Array.isArray(data)) {
        allData = data;
      } else if (data.data && Array.isArray(data.data)) {
        allData = data.data;
      }
      
      // Extract unique variety names
      const varietySet = new Set();
      allData.forEach(record => {
        if (record.variety && record.variety.trim()) {
          varietySet.add(record.variety.trim());
        }
      });
      
      // Convert to sorted array
      const varieties = Array.from(varietySet).sort();
      
      // Cache the result
      cacheRef.current.varieties[cacheKey] = varieties;
      
      console.log('Varieties fetched:', varieties.length);
      
      setFilterOptions(prev => ({ ...prev, varieties: varieties }));
    } catch (err) {
      console.error('Error fetching varieties:', err);
      setFilterOptions(prev => ({ ...prev, varieties: [] }));
    } finally {
      setLoadingFilters(prev => ({ ...prev, varieties: false }));
    }
  };

  // Fetch grade options from market price API
  const fetchGrades = async (stateName, districtName, marketName, commodityName, varietyName) => {
    // Create cache key
    const cacheKey = `${stateName}|${districtName}|${marketName}|${commodityName}|${varietyName}`;
    if (cacheRef.current.grades[cacheKey]) {
      setFilterOptions(prev => ({ ...prev, grades: cacheRef.current.grades[cacheKey] }));
      return;
    }

    setLoadingFilters(prev => ({ ...prev, grades: true }));
    try {
      let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_API_KEY}&format=json&limit=1000&offset=0&filters[state.keyword]=${encodeURIComponent(stateName)}&filters[district]=${encodeURIComponent(districtName)}&filters[market]=${encodeURIComponent(marketName)}&filters[commodity]=${encodeURIComponent(commodityName)}`;
      if (varietyName) {
        url += `&filters[variety]=${encodeURIComponent(varietyName)}`;
      }
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });
      
      const data = await res.json();
      
      // Extract records from response
      let allData = [];
      if (data.records && Array.isArray(data.records)) {
        allData = data.records;
      } else if (Array.isArray(data)) {
        allData = data;
      } else if (data.data && Array.isArray(data.data)) {
        allData = data.data;
      }
      
      // Extract unique grade names
      const gradeSet = new Set();
      allData.forEach(record => {
        if (record.grade && record.grade.trim()) {
          gradeSet.add(record.grade.trim());
        }
      });
      
      // Convert to sorted array
      const grades = Array.from(gradeSet).sort();
      
      // Cache the result
      cacheRef.current.grades[cacheKey] = grades;
      
      console.log('Grades fetched:', grades.length);
      
      setFilterOptions(prev => ({ ...prev, grades: grades }));
    } catch (err) {
      console.error('Error fetching grades:', err);
      setFilterOptions(prev => ({ ...prev, grades: [] }));
    } finally {
      setLoadingFilters(prev => ({ ...prev, grades: false }));
    }
  };

  // No initial fetch needed - all fields depend on state selection

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Build the base API URL with the API key and other required query parameters
      // Filter sequence: state.keyword -> district -> market -> commodity -> variety -> grade
      let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_API_KEY}&format=json&limit=1000&offset=0`;

      // Add filter parameters in the proper sequence
      if (formData.state) {
        url += `&filters[state.keyword]=${encodeURIComponent(formData.state)}`;
      }
      if (formData.district) {
        url += `&filters[district]=${encodeURIComponent(formData.district)}`;
      }
      if (formData.market) {
        url += `&filters[market]=${encodeURIComponent(formData.market)}`;
      }
      if (formData.commodity) {
        url += `&filters[commodity]=${encodeURIComponent(formData.commodity)}`;
      }
      if (formData.variety) {
        url += `&filters[variety]=${encodeURIComponent(formData.variety)}`;
      }
      if (formData.grade) {
        url += `&filters[grade]=${encodeURIComponent(formData.grade)}`;
      }

      const res = await fetch(url, {
        method: 'GET'
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="large text-primary">Market Price API</h1>
      <p className="lead">
        <i className="fas fa-chart-line"></i> Fetch market price data from data.gov.in
      </p>

      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <div className="form-group">
            <label htmlFor="state">State</label>
            <select
              name="state"
              id="state"
              value={formData.state}
              onChange={onChange}
            >
              <option value="">Select State</option>
              {filterOptions.states.map((state, index) => (
                <option key={index} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="district">District</label>
            <select
              name="district"
              id="district"
              value={formData.district}
              onChange={onChange}
              disabled={!formData.state}
            >
              <option value="">Select District</option>
              {loadingFilters.districts ? (
                <Fragment>
                  <option value="">Loading...</option>
                </Fragment>
              ) : (
                filterOptions.districts.map((district, index) => (
                  <option key={index} value={district}>
                    {district}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="market">Market</label>
            <select
              name="market"
              id="market"
              value={formData.market}
              onChange={onChange}
              disabled={!formData.district}
            >
              <option value="">Select Market</option>
              {loadingFilters.markets ? (
                <Fragment>
                  <option value="">Loading...</option>
                </Fragment>
              ) : (
                filterOptions.markets.map((market, index) => (
                  <option key={index} value={market}>
                    {market}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="commodity">Commodity</label>
            <select
              name="commodity"
              id="commodity"
              value={formData.commodity}
              onChange={onChange}
              disabled={!formData.market}
            >
              <option value="">Select Commodity</option>
              {loadingFilters.commodities ? (
                <Fragment>
                  <option value="">Loading...</option>
                </Fragment>
              ) : (
                filterOptions.commodities.map((commodity, index) => (
                  <option key={index} value={commodity}>
                    {commodity}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="variety">Variety</label>
            <select
              name="variety"
              id="variety"
              value={formData.variety}
              onChange={onChange}
              disabled={!formData.commodity}
            >
              <option value="">Select Variety</option>
              {loadingFilters.varieties ? (
                <Fragment>
                  <option value="">Loading...</option>
                </Fragment>
              ) : (
                filterOptions.varieties.map((variety, index) => (
                  <option key={index} value={variety}>
                    {variety}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="grade">Grade</label>
            <select
              name="grade"
              id="grade"
              value={formData.grade}
              onChange={onChange}
              disabled={!formData.commodity}
            >
              <option value="">Select Grade</option>
              {loadingFilters.grades ? (
                <Fragment>
                  <option value="">Loading...</option>
                </Fragment>
              ) : (
                filterOptions.grades.map((grade, index) => (
                  <option key={index} value={grade}>
                    {grade}
                  </option>
                ))
              )}
            </select>
          </div>

        </div>

        <input
          type="submit"
          className="btn btn-primary"
          value={loading ? 'Loading...' : 'Fetch Market Price Data'}
          disabled={loading}
        />
      </form>

      {error && (
        <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {response && (
        <div style={{ marginTop: '2rem' }}>
          <h2 className="text-primary">Market Price Data</h2>
          {response.records && response.records.length > 0 ? (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '1rem'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #007bff' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>State</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>District</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>Market</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>Commodity</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>Variety</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>Grade</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>Arrival Date</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>Min Price</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>Max Price</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Modal Price</th>
                </tr>
              </thead>
              <tbody>
                {response.records.map((record, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px', borderRight: '1px solid #ddd' }}>{record.state}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #ddd' }}>{record.district}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #ddd' }}>{record.market}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #ddd' }}>{record.commodity}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #ddd' }}>{record.variety}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #ddd' }}>{record.grade}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #ddd' }}>{record.arrival_date}</td>
                    <td style={{ padding: '10px', textAlign: 'right', borderRight: '1px solid #ddd' }}>{record.min_price}</td>
                    <td style={{ padding: '10px', textAlign: 'right', borderRight: '1px solid #ddd' }}>{record.max_price}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{record.modal_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No records found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketPrice;
