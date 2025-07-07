import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import AuthForm from "./components/AuthForm";
import Scheduler from "./components/Scheduler";
import SchedulerLayout from "./components/SchedulerLayout";



export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  if (user === undefined) return <p>Loading...</p>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/scheduler" /> : <AuthForm />} />
      <Route path="/scheduler" element={user ? <Scheduler /> : <Navigate to="/" />} />
    </Routes>
  );
}
