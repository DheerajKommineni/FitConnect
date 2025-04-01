import React, { useState } from 'react';
import axios from 'axios';
import './Exercises.css';

function Exercises() {
  const [bodyParts, setBodyParts] = useState([
    'chest',
    'legs',
    'arms',
    'back',
    'core',
  ]);
  const [selectedBodyParts, setSelectedBodyParts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [videoData, setVideoData] = useState({});

  const handleBodyPartClick = bodyPart => {
    setSelectedBodyParts(prevSelected =>
      prevSelected.includes(bodyPart)
        ? prevSelected.filter(part => part !== bodyPart)
        : [...prevSelected, bodyPart],
    );
  };

  const handleSave = async () => {
    try {
      const response = await axios.post(
        'http://localhost:8000/api/filter-exercises',
        { selectedBodyParts },
      );
      const newExercises = response.data;

      setExercises(newExercises);
      setVideoData({});

      // Trigger YouTube search for each new exercise
      newExercises.forEach(exercise => {
        searchYouTube(exercise.bodyPart, exercise.name);
      });
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  //   const searchYouTube = async (bodyPart, exerciseName) => {
  //     try {
  //       const response = await axios.post('http://localhost:8000/api/search-youtube', { bodyPart, exerciseName });
  //       const videoInfo = response.data;

  //       setVideoData(prevData => ({
  //         ...prevData,
  //         [`${bodyPart}-${exerciseName}`]: videoInfo
  //       }));
  //     } catch (error) {
  //       console.error('Error fetching YouTube video:', error);
  //     }
  //   };

  const parseFields = exercise => {
    const instructions = [];
    const secondaryMuscles = [];

    for (let i = 0; i <= 10; i++) {
      if (exercise[`instructions/${i}`]) {
        instructions.push(exercise[`instructions/${i}`]);
      }
      if (exercise[`secondaryMuscles/${i}`]) {
        secondaryMuscles.push(exercise[`secondaryMuscles/${i}`]);
      }
    }

    return { instructions, secondaryMuscles };
  };

  return (
    <div className="exercises-page">
      <h2>Select Body Parts</h2>
      <div className="body-parts-grid">
        {bodyParts.map(bodyPart => (
          <div
            key={bodyPart}
            className={`body-part-block ${
              selectedBodyParts.includes(bodyPart) ? 'selected' : ''
            }`}
            onClick={() => handleBodyPartClick(bodyPart)}
          >
            {bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1)}
          </div>
        ))}
      </div>
      <button className="save-button" onClick={handleSave}>
        Submit
      </button>

      {exercises.length > 0 && (
        <div className="exercises-list">
          <h2>Exercises</h2>
          <ul>
            {exercises.map(exercise => {
              const { instructions, secondaryMuscles } = parseFields(exercise);

              return (
                <li key={exercise.id} className="exercise-item">
                  <h3>{exercise.name}</h3>
                  <img
                    src={
                      videoData?.[`${exercise.bodyPart}-${exercise.name}`]
                        ?.videoThumbnail || 'default_image.png'
                    }
                    alt={exercise.name}
                  />
                  <p>Equipment: {exercise.equipment}</p>
                  <p>Target: {exercise.target}</p>
                  <p>Instructions:</p>
                  <ul>
                    {instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                  <p>Secondary Muscles:</p>
                  <ul>
                    {secondaryMuscles.map((muscle, index) => (
                      <li key={index}>{muscle}</li>
                    ))}
                  </ul>
                  {videoData?.[`${exercise.bodyPart}-${exercise.name}`] && (
                    <a
                      href={
                        videoData[`${exercise.bodyPart}-${exercise.name}`]
                          .videoUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Watch Video
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Exercises;
