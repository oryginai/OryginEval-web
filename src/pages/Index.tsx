
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to auth page
  return <Navigate to="/auth" replace />;
};

export default Index;
