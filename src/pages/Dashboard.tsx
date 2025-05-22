
import React from "react";
import { useParams } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>
      <p className="text-muted-foreground">
        Dashboard page will be implemented in the future.
      </p>
    </div>
  );
};

export default Dashboard;
