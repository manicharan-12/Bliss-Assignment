import React from "react";
import { Link } from "react-router-dom";
import styled from 'styled-components';

const NavbarContainer = styled.nav`
  background-color: #3498db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: #000;
  }
`;

const Navbar = () => {
  return (
    <NavbarContainer>
      <NavContent>
        <Logo to="/courses">University Companion</Logo>
      </NavContent>
    </NavbarContainer>
  );
};

export default Navbar;