import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import { useNavigate } from 'react-router-dom';
import './WeightAnalyzer.css';

const WeightAnalyzer = () => {
  const [foodItems, setFoodItems] = useState([{ food: '', quantity: '' }]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentGender, setCurrentGender] = useState('');
  const [currentAge, setCurrentAge] = useState('');
  const [currentHeight, setCurrentHeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [idealBodyWeight, setIdealBodyWeight] = useState('');
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState(null);
  const [caloriesExpended, setCaloriesExpended] = useState(null);
  const [weightGained, setWeightGained] = useState(null);
  const [caloricBalance, setCaloricBalance] = useState(null); // New state for caloric balance
  const [projectedWeightChange, setProjectedWeightChange] = useState(null); // New state for projected weight change
  const [suggestions, setSuggestions] = useState([]);
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showGenderInput, setShowGenderInput] = useState(false);
  const [showAgeInput, setShowAgeInput] = useState(false);
  const [showHeightInput, setShowHeightInput] = useState(false);
  const [showCaloriesInput, setShowCaloriesInput] = useState(false);
  const [totalCalories, setTotalCalories] = useState(null);
  const [xToken, setXToken] = useContext(store);
  const navigate = useNavigate();

  // Fetch user fitness data from the backend
  const fetchUserCaloriesData = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8000/user-calories-data',
        {
          headers: {
            'x-token': xToken,
          },
          withCredentials: true,
        },
      );

      const {
        weight: dbWeight,
        caloriesExpended: dbCaloriesExpended,
        gender: dbGender,
        age: dbAge,
        height: dbHeight,
      } = response.data;
      console.debug('Fetched user data:', { dbWeight, dbCaloriesExpended });

      setWeight(dbWeight);
      setGender(dbGender);
      setAge(dbAge);
      setHeight(dbHeight);
      setCaloriesExpended(dbCaloriesExpended);
      setShowWeightInput(
        dbWeight === null || dbWeight === undefined || dbWeight === 0,
      );
      setShowGenderInput(
        dbGender === null || dbGender === undefined || dbGender === 0,
      );
      setShowAgeInput(dbAge === null || dbAge === undefined || dbAge === 0);
      setShowHeightInput(
        dbHeight === null || dbHeight === undefined || dbHeight === 0,
      );
      setShowCaloriesInput(
        dbCaloriesExpended === null || dbCaloriesExpended === undefined,
      );
      const idealBodyWeight = calculateIdealBodyWeight(height, gender);
      setIdealBodyWeight(idealBodyWeight);
    } catch (error) {
      console.error('Error fetching user fitness data:', error);
    }
  };

  // Fetch suggestions based on the user's input
  const fetchSuggestions = async (index, query) => {
    if (query.length > 2) {
      try {
        const response = await axios.post(
          'http://localhost:8000/get-suggestions',
          { query },
        );
        console.debug('Fetched suggestions:', response.data);
        setSuggestions({
          ...suggestions,
          [index]: response.data,
        });
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions({
        ...suggestions,
        [index]: [],
      });
    }
  };

  useEffect(() => {
    fetchUserCaloriesData();
  }, []);

  const handleFoodChange = (index, e) => {
    const updatedFoodItems = [...foodItems];
    updatedFoodItems[index].food = e.target.value;
    setFoodItems(updatedFoodItems);
    setActiveInputIndex(index);
    fetchSuggestions(index, e.target.value);
  };

  const handleQuantityChange = (index, e) => {
    const updatedFoodItems = [...foodItems];
    updatedFoodItems[index].quantity = e.target.value;
    setFoodItems(updatedFoodItems);
  };

  const handleSuggestionClick = (index, suggestion) => {
    const updatedFoodItems = [...foodItems];
    updatedFoodItems[index].food = suggestion.fooditem;
    setFoodItems(updatedFoodItems);
    setSuggestions({
      ...suggestions,
      [index]: [],
    });
  };

  const handleAddFoodItem = () => {
    setFoodItems([...foodItems, { food: '', quantity: '' }]);
  };

  const calculateIdealBodyWeight = (height, gender) => {
    const heightInCm = height * 30.48;
    // Convert height from centimeters to inches
    const heightInInches = heightInCm / 2.54;

    let idealBodyWeight;

    if (gender === 'M') {
      // IBW for Men
      idealBodyWeight = 50 + 2.3 * (heightInInches - 60);
    } else if (gender === 'F') {
      // IBW for Women
      idealBodyWeight = 45.5 + 2.3 * (heightInInches - 60);
    } else {
      throw new Error("Invalid gender value. Gender should be 'M' or 'F'.");
    }

    return idealBodyWeight;
  };

  const provideWeightInsights = (height, currentWeight) => {
    const weightDifference = currentWeight - idealBodyWeight;

    if (Math.abs(weightDifference) <= 5) {
      return `Great job! Your current weight (${currentWeight} kg) is close to your ideal body weight (${idealBodyWeight} kg) for your height (${height} ft), which suggests that you're maintaining a healthy weight.`;
    } else if (weightDifference > 5) {
      return `Your current weight (${currentWeight} kg) is above the ideal body weight (${idealBodyWeight} kg) for your height (${height} ft). Consider incorporating more physical activity or reviewing your dietary habits to work towards your ideal weight.`;
    } else {
      return `Your current weight (${currentWeight} kg) is below the ideal body weight (${idealBodyWeight} kg) for your height (${height} ft). Make sure you're consuming enough calories and nutrients to maintain a healthy body weight.`;
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();

    try {
      // Calculate Ideal Body Weight if height and gender are available
      if (height && gender) {
        const calculatedIdealBodyWeight = calculateIdealBodyWeight(
          height,
          gender,
        );
        setIdealBodyWeight(calculatedIdealBodyWeight);
      }

      const caloriePromises = foodItems.map(item =>
        axios.post(
          'http://localhost:8000/get-calories',
          { food: item.food },
          {
            headers: {
              'x-token': xToken,
            },
            withCredentials: true,
          },
        ),
      );

      const responses = await Promise.all(caloriePromises);
      console.debug('Calorie fetch responses:', responses);

      const totalCalories = responses.reduce((total, response, index) => {
        const calorieString = response.data.calories || '';
        const foodCaloriesPer100g = parseFloat(calorieString);

        console.log('Raw calories data:', calorieString);
        console.log('Parsed calories per 100g:', foodCaloriesPer100g);

        if (isNaN(foodCaloriesPer100g)) {
          console.error(
            `Invalid calorie value for ${foodItems[index].food}: ${calorieString}`,
          );
          return total; // Skip this item
        }

        const quantity = parseFloat(foodItems[index].quantity);
        if (isNaN(quantity)) {
          console.error(
            `Invalid quantity for ${foodItems[index].food}: ${foodItems[index].quantity}`,
          );
          return total; // Skip this item
        }

        const itemCalories = (foodCaloriesPer100g * quantity) / 100;
        console.log('Item Calories:', itemCalories);
        console.log('Total before addition:', total);
        return total + itemCalories;
      }, 0);

      console.debug('Total calories:', totalCalories);
      setTotalCalories(totalCalories);

      const finalCaloriesExpended =
        caloriesExpended !== null && caloriesExpended !== undefined
          ? caloriesExpended
          : 0;
      const calorieDifference = totalCalories - finalCaloriesExpended;

      // Weight change calculation
      const weightChange = calorieDifference / 7700; // Approximation of 1 kg per 7700 kcal
      setWeightGained(weightChange);

      // Caloric balance and projected weight change calculations
      const newCaloricBalance = totalCalories - finalCaloriesExpended;
      setCaloricBalance(newCaloricBalance);

      console.debug('Weight change:', weightChange);
      console.debug('Caloric balance:', newCaloricBalance);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // const handleLogout = () => {
  //   localStorage.removeItem('x-token');
  //   setXToken(null);
  //   navigate('/login');
  // };

  return (
    <div>
      <h1>Weight Analyzer</h1>

      <form onSubmit={handleSubmit}>
        {foodItems.map((item, index) => (
          <div key={index}>
            <label htmlFor={`food-item-${index}`}>Food Item:</label>
            <input
              id={`food-item-${index}`}
              type="text"
              value={item.food}
              onChange={e => handleFoodChange(index, e)}
              onFocus={() => setActiveInputIndex(index)}
              required
              autoComplete="off"
            />
            {suggestions[activeInputIndex]?.length > 0 &&
              index === activeInputIndex && (
                <ul className="suggestions-list">
                  {suggestions[activeInputIndex].map((suggestion, i) => (
                    <li
                      key={i}
                      onClick={() => handleSuggestionClick(index, suggestion)}
                    >
                      {suggestion.fooditem}
                    </li>
                  ))}
                </ul>
              )}
            <label htmlFor={`quantity-${index}`}>Quantity (grams):</label>
            <input
              id={`quantity-${index}`}
              type="number"
              value={item.quantity}
              onChange={e => handleQuantityChange(index, e)}
              required
              autoComplete="off"
            />
          </div>
        ))}
        <button type="button" onClick={handleAddFoodItem}>
          Add Another Food Item
        </button>
        {showWeightInput ? (
          <div>
            <label htmlFor="current-weight">Current Weight (kg):</label>
            <input
              id="current-weight"
              type="number"
              value={currentWeight}
              onChange={e => setCurrentWeight(e.target.value)}
              required
              autoComplete="current-weight"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="current-weight">Current Weight (kg):</label>
            <p>{weight}</p>
          </div>
        )}
        {showGenderInput ? (
          <div>
            <label htmlFor="gender">Gender :</label>
            <input
              id="gender"
              value={currentGender}
              onChange={e => setCurrentGender(e.target.value)}
              required
              autoComplete="gender"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="gender">Gender:</label>
            <p>{gender}</p>
          </div>
        )}
        {showAgeInput ? (
          <div>
            <label htmlFor="age">Age :</label>
            <input
              id="age"
              value={currentAge}
              onChange={e => setCurrentAge(e.target.value)}
              required
              autoComplete="age"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="age">Age:</label>
            <p>{age}</p>
          </div>
        )}
        {showHeightInput ? (
          <div>
            <label htmlFor="height">Height :</label>
            <input
              id="height"
              value={currentHeight}
              onChange={e => setCurrentHeight(e.target.value)}
              required
              autoComplete="height"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="height">Height (Ft):</label>
            <p>{height}</p>
          </div>
        )}
        {/* <div>
          <label htmlFor="target-weight">Target Weight (kg):</label>
          <input
            id="target-weight"
            type="number"
            value={targetWeight}
            onChange={e => setTargetWeight(e.target.value)}
            required
            autoComplete="target-weight"
          />
        </div> */}
        <button type="submit">Analyze</button>
      </form>
      {weightGained !== null && (
        <div className="results">
          <h2>Results</h2>
          <p>Calories burnt today (Google Fit): {caloriesExpended} cal</p>
          <p>Calories intake through food: {totalCalories} cal</p>
          <p>Weight Gained: {weightGained.toFixed(2)} kg</p>
          <p>Caloric Balance: {caloricBalance.toFixed(2)} cal</p>
          {/* <p>
            Projected Weight Change to Reach Target:{' '}
            {projectedWeightChange.toFixed(2)} kg
          </p> */}
          <p>{provideWeightInsights(height, weight)}</p>
        </div>
      )}
    </div>
  );
};

export default WeightAnalyzer;
