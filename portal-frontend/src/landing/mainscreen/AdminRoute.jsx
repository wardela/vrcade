import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Check if the user is logged in and has the 'admin' role
  if (user && user.role === "admin") {
    return children; // Render the child component if the user is an admin
  } else {
    return <Navigate to="/success/dashboard" />; // Redirect non-admins to the dashboard
  }
};

export default AdminRoute;
