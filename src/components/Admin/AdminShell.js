import React from 'react';

const AdminShell = ({ children }) => {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {children}
    </div>
  );
};

export default AdminShell;
