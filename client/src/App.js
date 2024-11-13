import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import styled, { createGlobalStyle } from "styled-components";
import CourseList from "./components/CourseList";
import AssignmentList from "./components/AssignmentList";
import Navbar from "./components/Navbar";
import "react-toastify/dist/ReactToastify.css";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background-color: #f0f2f5;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ContentContainer = styled.div`
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

function App() {
  return (
    <Router>
      <GlobalStyle />
      <AppContainer>
        <Navbar />
        <ContentContainer>
          <Routes>
            <Route path="/" element={<Navigate to="/courses" />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/assignments/:courseId" element={<AssignmentList />} />
          </Routes>
        </ContentContainer>
        <ToastContainer position="bottom-right" />
      </AppContainer>
    </Router>
  );
}

export default App;
