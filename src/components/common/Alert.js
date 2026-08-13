import React from 'react';
import { motion } from 'framer-motion'; // Import motion

/**
 * Alert component
 * @param {object} props
 * @param {'error' | 'success' | 'warning' | 'info'} props.type - The type of alert
 * @param {string} props.message - The message to display
 * @param {Array<string>} [props.messages] - Optional array of messages for list display
 * @param {string} [props.title] - Optional title for the alert
 */
const Alert = ({ type = 'info', message, messages, title }) => {
  const alertTypeClasses = {
    error: 'alert-danger', 
    success: 'alert-success', 
    warning: 'alert-warning', 
    info: 'alert-info', 
  };

  const baseClass = 'alert';
  const typeClass = alertTypeClasses[type] || alertTypeClasses.info;

  const alertVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2 } } 
  };

  return (
    <motion.div
      className={`${baseClass} ${typeClass} mb-3`}
      role="alert"
      variants={alertVariants}
      initial="hidden"
      animate="visible"
      exit="exit" 
    >
      {title && <h4 className="alert-heading">{title}</h4>}
      {message && <p className="mb-0">{message}</p>}
      {messages && messages.length > 0 && (
        <>
          {message && <hr />}
          <ul className="mb-0">
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </>
      )}
    </motion.div>
  );
};

export default Alert;