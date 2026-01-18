import React from "react";
import styled from "styled-components";

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader" />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;

  .loader {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loader::before,
  .loader::after {
    position: absolute;
    content: "";
    height: 8em;
    width: 8em;
    border: 1em solid #0060fa;
    border-radius: 50%;
    animation: loader_79178 2s linear infinite;
  }

  .loader::after {
    opacity: 0;
    animation-delay: 1s;
  }

  @keyframes loader_79178 {
    0% {
      border: 1em solid #0060fa;
      transform: scale(0);
      opacity: 1;
    }

    100% {
      border: 0 solid #0060fa;
      transform: scale(1);
      opacity: 0;
    }
  }
`;

export default Loader;
