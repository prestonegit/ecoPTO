import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

const LottiePlayer = ({ animationSrc }) => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(animationSrc)
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error('Error fetching animation data:', error));
  }, [animationSrc]);

  if (!animationData) {
    return <div>Loading animation...</div>;
  }

  return <Lottie animationData={animationData} loop={true} />;
};

export default LottiePlayer;
