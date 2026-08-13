import React from 'react';
import { motion } from 'framer-motion';
import './SplashScreen.css'; 

const SplashScreen = () => {
  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img
        src="/logo.png"
        alt="Loading..."
        className="splash-icon"
        animate={{ opacity: [0.4, 1, 0.4] }} 
        transition={{
          loop: Infinity,
          duration: 2, 
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default SplashScreen;